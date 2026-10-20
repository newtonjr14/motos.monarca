package com.monarca.devolucao.repository

import com.monarca.audit.domain.AuditAction
import com.monarca.audit.repository.gravarAuditLog
import com.monarca.caixa.domain.TipoMovimentacaoCaixa
import com.monarca.caixa.repository.CaixaMovimentacaoFinalizadoresTable
import com.monarca.caixa.repository.CaixaMovimentacoesTable
import com.monarca.common.enums.Status
import com.monarca.cotacao.repository.CotacoesTable
import com.monarca.estoque.repository.EstoqueProdutosTable
import com.monarca.estoque.repository.registrarMovimentoEstoque
import com.monarca.pessoa.repository.ClientesTable
import com.monarca.pessoa.repository.PessoasTable
import com.monarca.produto.domain.SituacaoUnidade
import com.monarca.produto.repository.ProdutoUnidadesTable
import com.monarca.produto.repository.ProdutosTable
import com.monarca.titulo.domain.StatusParcela
import com.monarca.titulo.domain.StatusTitulo
import com.monarca.titulo.repository.ParcelasReceberTable
import com.monarca.titulo.repository.TitulosReceberTable
import com.monarca.localidade.service.invalido
import com.monarca.venda.repository.VendaItemUnidadesTable
import com.monarca.venda.repository.VendaItensTable
import com.monarca.venda.repository.VendasTable
import kotlin.math.round
import org.jetbrains.exposed.v1.core.JoinType
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.greater
import org.jetbrains.exposed.v1.core.inList
import org.jetbrains.exposed.v1.core.neq
import org.jetbrains.exposed.v1.r2dbc.R2dbcDatabase
import org.jetbrains.exposed.v1.r2dbc.insert
import org.jetbrains.exposed.v1.r2dbc.selectAll
import org.jetbrains.exposed.v1.r2dbc.transactions.suspendTransaction
import org.jetbrains.exposed.v1.r2dbc.update

class ExposedDevolucaoRepository(
    private val database: R2dbcDatabase,
) : DevolucaoRepository {

    override suspend fun vendaParaDevolucao(idVenda: Long): VendaParaDevolucao? = suspendTransaction(database) {
        val row = VendasTable
            .innerJoin(ClientesTable)
            .innerJoin(PessoasTable)
            .innerJoin(CotacoesTable)
            .selectAll()
            .where { VendasTable.id eq idVenda }
            .singleOrNull() ?: return@suspendTransaction null
        val itens = VendaItensTable
            .innerJoin(ProdutosTable)
            .selectAll()
            .where { VendaItensTable.idVenda eq idVenda }
            .toList()
        val idsItens = itens.map { it[VendaItensTable.id].value }
        val devolvido = quantidadeDevolvida(idVenda)
        val chassis = if (idsItens.isEmpty()) emptyMap() else {
            VendaItemUnidadesTable
                .join(ProdutoUnidadesTable, JoinType.INNER, VendaItemUnidadesTable.idProdutoUnidade, ProdutoUnidadesTable.id)
                .selectAll()
                .where {
                    (VendaItemUnidadesTable.idVendaItem inList idsItens) and
                        (ProdutoUnidadesTable.situacao eq SituacaoUnidade.VENDIDO.name.lowercase())
                }
                .toList()
                .groupBy { it[VendaItemUnidadesTable.idVendaItem].value }
        }
        row.toVenda(
            abertoPyg = abertoPyg(idVenda),
            itens = itens.map { item ->
                val idItem = item[VendaItensTable.id].value
                ItemDevolucaoDisponivel(
                    idVendaItem = idItem,
                    idProduto = item[VendaItensTable.idProduto].value,
                    idEstoque = item[VendaItensTable.idEstoque].value,
                    produtoCodigo = item[ProdutosTable.codigo],
                    produtoNome = item[ProdutosTable.nome],
                    controlaChassi = item[ProdutosTable.controlaChassi],
                    quantidadeVendida = item[VendaItensTable.quantidade],
                    quantidadeDevolvida = devolvido[idItem] ?: 0,
                    totalPyg = item[VendaItensTable.totalPyg],
                    chassis = chassis[idItem].orEmpty().map {
                        ChassisDevolucao(
                            id = it[ProdutoUnidadesTable.id].value,
                            numero = it[ProdutoUnidadesTable.numero],
                        )
                    },
                )
            },
        )
    }

    override suspend fun saldoCredito(idFilial: Long, idCliente: Long): Double = suspendTransaction(database) {
        ClienteCreditoTable.selectAll().where {
            (ClienteCreditoTable.idFilial eq idFilial) and
                (ClienteCreditoTable.idCliente eq idCliente) and
                (ClienteCreditoTable.status eq Status.ATIVO.name.lowercase())
        }.toList().sumOf { it[ClienteCreditoTable.valorPyg] }
    }

    override suspend fun listar(idFilial: Long): List<DevolucaoLista> = suspendTransaction(database) {
        val rows = DevolucoesTable
            .innerJoin(ClientesTable)
            .innerJoin(PessoasTable)
            .selectAll()
            .where {
                (DevolucoesTable.idFilial eq idFilial) and
                    (DevolucoesTable.status eq "finalizada")
            }
            .orderBy(DevolucoesTable.criadoEm to SortOrder.DESC)
            .toList()
        rows.map { it.toLista(itensDa(it[DevolucoesTable.id].value)) }
    }

    override suspend fun buscar(id: Long): DevolucaoLista? = suspendTransaction(database) {
        val row = DevolucoesTable
            .innerJoin(ClientesTable)
            .innerJoin(PessoasTable)
            .selectAll()
            .where { DevolucoesTable.id eq id }
            .singleOrNull() ?: return@suspendTransaction null
        row.toLista(itensDa(id))
    }

    override suspend fun inserir(devolucao: DevolucaoNova): Long = suspendTransaction(database) {
        val agora = System.currentTimeMillis()
        val inserted = DevolucoesTable.insert {
            it[idFilial] = devolucao.idFilial
            it[idVenda] = devolucao.idVenda
            it[idCliente] = devolucao.idCliente
            it[valorPyg] = devolucao.valorPyg
            it[abatidoPyg] = devolucao.abatidoPyg
            it[excessoPyg] = devolucao.excessoPyg
            it[tratamento] = devolucao.tratamento
            it[idFinalizador] = devolucao.idFinalizador
            it[moedaCaixa] = devolucao.moedaCaixa
            it[valorCaixa] = devolucao.valorCaixa
            it[idCaixaSessao] = devolucao.idCaixaSessao
            it[idCotacao] = devolucao.idCotacao
            it[usdPyg] = devolucao.usdPyg
            it[brlPyg] = devolucao.brlPyg
            it[observacao] = devolucao.observacao
            it[criadoEm] = agora
            it[idUsuario] = devolucao.idUsuario
            it[status] = "finalizada"
        }
        val idDevolucao = inserted[DevolucoesTable.id].value
        for (item in devolucao.itens) {
            val itemRow = DevolucaoItensTable.insert {
                it[DevolucaoItensTable.idDevolucao] = idDevolucao
                it[idVendaItem] = item.idVendaItem
                it[quantidade] = item.quantidade
                it[valorPyg] = item.valorPyg
            }
            val idItem = itemRow[DevolucaoItensTable.id].value
            for (idUnidade in item.idsUnidades) {
                DevolucaoItemUnidadesTable.insert {
                    it[idDevolucaoItem] = idItem
                    it[idProdutoUnidade] = idUnidade
                }
                val n = ProdutoUnidadesTable.update({
                    (ProdutoUnidadesTable.id eq idUnidade) and
                        (ProdutoUnidadesTable.situacao eq SituacaoUnidade.VENDIDO.name.lowercase())
                }) {
                    it[situacao] = SituacaoUnidade.DISPONIVEL.name.lowercase()
                    it[idVendaItem] = null
                }
                if (n == 0) throw invalido("DEVOLUCAO_CHASSI", "Um chassi desta devolução já não está vendido")
            }
            devolverEstoque(item.idProduto, item.idEstoque, item.quantidade, idDevolucao, devolucao.idUsuario)
        }
        if (devolucao.abatidoPyg > 0.5) abaterTitulo(devolucao.idVenda, devolucao.abatidoPyg)
        if (devolucao.tratamento == "credito" && devolucao.excessoPyg > 0.5) {
            ClienteCreditoTable.insert {
                it[idFilial] = devolucao.idFilial
                it[idCliente] = devolucao.idCliente
                it[ClienteCreditoTable.idDevolucao] = idDevolucao
                it[valorPyg] = devolucao.excessoPyg
                it[criadoEm] = agora
                it[status] = Status.ATIVO.name.lowercase()
            }
        }
        if (devolucao.tratamento == "caixa" && devolucao.idCaixaSessao != null && devolucao.idFinalizador != null) {
            val mov = CaixaMovimentacoesTable.insert {
                it[idCaixaSessao] = devolucao.idCaixaSessao
                it[tipo] = TipoMovimentacaoCaixa.DEVOLUCAO.name.lowercase()
                it[idUsuario] = devolucao.idUsuario
                it[idVenda] = devolucao.idVenda
                it[criadoEm] = agora
                it[status] = Status.ATIVO.name.lowercase()
            }
            CaixaMovimentacaoFinalizadoresTable.insert {
                it[idCaixaMovimentacao] = mov[CaixaMovimentacoesTable.id].value
                it[idFinalizador] = devolucao.idFinalizador
                it[moeda] = devolucao.moedaCaixa ?: "pyg"
                it[valor] = devolucao.valorCaixa ?: 0.0
                it[valorPyg] = devolucao.excessoPyg
            }
        }
        gravarAuditLog("devolucao", idDevolucao.toString(), AuditAction.INSERT, newValues = """{"valor":${devolucao.valorPyg}}""")
        idDevolucao
    }

    private suspend fun quantidadeDevolvida(idVenda: Long): Map<Long, Int> {
        return DevolucaoItensTable
            .innerJoin(DevolucoesTable)
            .selectAll()
            .where {
                (DevolucoesTable.idVenda eq idVenda) and
                    (DevolucoesTable.status eq "finalizada")
            }
            .toList()
            .groupBy { it[DevolucaoItensTable.idVendaItem].value }
            .mapValues { (_, rows) -> rows.sumOf { it[DevolucaoItensTable.quantidade] } }
    }

    private suspend fun abertoPyg(idVenda: Long): Double {
        return ParcelasReceberTable
            .innerJoin(TitulosReceberTable)
            .selectAll()
            .where {
                (TitulosReceberTable.idVenda eq idVenda) and
                    (TitulosReceberTable.status neq StatusTitulo.CANCELADO.name.lowercase()) and
                    (ParcelasReceberTable.saldo greater 0.009)
            }
            .toList()
            .sumOf { parcela ->
                val valor = parcela[ParcelasReceberTable.valor]
                val valorPyg = parcela[ParcelasReceberTable.valorPyg]
                if (valor <= 0.0) 0.0 else parcela[ParcelasReceberTable.saldo] / valor * valorPyg
            }
    }

    private suspend fun abaterTitulo(idVenda: Long, pyg: Double) {
        var resta = pyg
        val parcelas = ParcelasReceberTable
            .innerJoin(TitulosReceberTable)
            .selectAll()
            .where {
                (TitulosReceberTable.idVenda eq idVenda) and
                    (TitulosReceberTable.status neq StatusTitulo.CANCELADO.name.lowercase()) and
                    (ParcelasReceberTable.saldo greater 0.009)
            }
            .orderBy(ParcelasReceberTable.numero to SortOrder.DESC)
            .toList()
        val titulos = parcelas.map { it[TitulosReceberTable.id].value }.distinct()
        for (parcela in parcelas) {
            if (resta <= 0.5) break
            val valor = parcela[ParcelasReceberTable.valor]
            val valorPyg = parcela[ParcelasReceberTable.valorPyg]
            val saldo = parcela[ParcelasReceberTable.saldo]
            val aberto = if (valor <= 0.0) 0.0 else saldo / valor * valorPyg
            val toma = minOf(resta, aberto)
            val corta = if (valorPyg <= 0.0) 0.0 else toma / valorPyg * valor
            val novo = (saldo - corta).coerceAtLeast(0.0)
            val status = when {
                novo <= 0.009 && saldo + 0.009 >= valor -> StatusParcela.CANCELADA.name.lowercase()
                novo <= 0.009 -> StatusParcela.PAGA.name.lowercase()
                novo + 0.009 < valor -> StatusParcela.PARCIAL.name.lowercase()
                else -> StatusParcela.ABERTA.name.lowercase()
            }
            ParcelasReceberTable.update({ ParcelasReceberTable.id eq parcela[ParcelasReceberTable.id].value }) {
                it[ParcelasReceberTable.saldo] = if (novo <= 0.009) 0.0 else novo
                it[ParcelasReceberTable.status] = status
            }
            resta -= toma
        }
        for (idTitulo in titulos) atualizarStatusTitulo(idTitulo)
    }

    private suspend fun atualizarStatusTitulo(idTitulo: Long) {
        val parcelas = ParcelasReceberTable.selectAll().where { ParcelasReceberTable.idTitulo eq idTitulo }.toList()
        val status = when {
            parcelas.all { it[ParcelasReceberTable.status] == StatusParcela.CANCELADA.name.lowercase() } ->
                StatusTitulo.CANCELADO.name.lowercase()
            parcelas.all {
                val s = it[ParcelasReceberTable.status]
                s == StatusParcela.PAGA.name.lowercase() || s == StatusParcela.CANCELADA.name.lowercase()
            } -> StatusTitulo.QUITADO.name.lowercase()
            parcelas.any { it[ParcelasReceberTable.saldo] + 0.009 < it[ParcelasReceberTable.valor] } ->
                StatusTitulo.PARCIAL.name.lowercase()
            else -> StatusTitulo.ABERTO.name.lowercase()
        }
        TitulosReceberTable.update({ TitulosReceberTable.id eq idTitulo }) {
            it[TitulosReceberTable.status] = status
        }
    }

    private suspend fun devolverEstoque(idProduto: Long, idEstoque: Long, qtd: Int, idDevolucao: Long, idUsuario: Long) {
        val saldo = EstoqueProdutosTable.selectAll().where {
            (EstoqueProdutosTable.idEstoque eq idEstoque) and
                (EstoqueProdutosTable.idProduto eq idProduto) and
                (EstoqueProdutosTable.status neq Status.DELETADO.name.lowercase())
        }.singleOrNull()
        val saldoDepois = if (saldo == null) {
            EstoqueProdutosTable.insert {
                it[EstoqueProdutosTable.idEstoque] = idEstoque
                it[EstoqueProdutosTable.idProduto] = idProduto
                it[quantidade] = qtd
                it[quantidadeReservada] = 0
                it[status] = Status.ATIVO.name.lowercase()
            }
            qtd
        } else {
            val depois = saldo[EstoqueProdutosTable.quantidade] + qtd
            EstoqueProdutosTable.update({ EstoqueProdutosTable.id eq saldo[EstoqueProdutosTable.id].value }) {
                it[quantidade] = depois
            }
            depois
        }
        registrarMovimentoEstoque(
            idEstoque = idEstoque,
            idProduto = idProduto,
            tipo = "devolucao",
            quantidade = qtd,
            saldoDepois = saldoDepois,
            idDocumento = idDevolucao,
            idUsuario = idUsuario,
        )
    }

    private suspend fun itensDa(idDevolucao: Long): List<DevolucaoItemLista> {
        val itens = DevolucaoItensTable
            .innerJoin(VendaItensTable)
            .innerJoin(ProdutosTable)
            .selectAll()
            .where { DevolucaoItensTable.idDevolucao eq idDevolucao }
            .toList()
        val ids = itens.map { it[DevolucaoItensTable.id].value }
        val chassis = if (ids.isEmpty()) emptyMap() else {
            DevolucaoItemUnidadesTable
                .innerJoin(ProdutoUnidadesTable)
                .selectAll()
                .where { DevolucaoItemUnidadesTable.idDevolucaoItem inList ids }
                .toList()
                .groupBy { it[DevolucaoItemUnidadesTable.idDevolucaoItem].value }
        }
        return itens.map { item ->
            val id = item[DevolucaoItensTable.id].value
            DevolucaoItemLista(
                id = id,
                produtoCodigo = item[ProdutosTable.codigo],
                produtoNome = item[ProdutosTable.nome],
                quantidade = item[DevolucaoItensTable.quantidade],
                valorPyg = item[DevolucaoItensTable.valorPyg],
                chassis = chassis[id].orEmpty().map { it[ProdutoUnidadesTable.numero] },
            )
        }
    }

    private fun ResultRow.toVenda(abertoPyg: Double, itens: List<ItemDevolucaoDisponivel>) = VendaParaDevolucao(
        id = this[VendasTable.id].value,
        idFilial = this[VendasTable.idFilial].value,
        idCliente = this[VendasTable.idCliente].value,
        clienteNome = this[PessoasTable.nomeRazaoSocial],
        totalPyg = this[VendasTable.totalPyg],
        abertoPyg = round(abertoPyg),
        idCotacao = this[VendasTable.idCotacao].value,
        usdPyg = this[CotacoesTable.usdPyg],
        brlPyg = this[CotacoesTable.brlPyg],
        status = this[VendasTable.status],
        itens = itens,
    )

    private fun ResultRow.toLista(itens: List<DevolucaoItemLista>) = DevolucaoLista(
        id = this[DevolucoesTable.id].value,
        idVenda = this[DevolucoesTable.idVenda].value,
        clienteNome = this[PessoasTable.nomeRazaoSocial],
        valorPyg = this[DevolucoesTable.valorPyg],
        abatidoPyg = this[DevolucoesTable.abatidoPyg],
        excessoPyg = this[DevolucoesTable.excessoPyg],
        tratamento = this[DevolucoesTable.tratamento],
        criadoEm = this[DevolucoesTable.criadoEm],
        itens = itens,
    )
}
