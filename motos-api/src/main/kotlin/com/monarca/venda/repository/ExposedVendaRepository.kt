package com.monarca.venda.repository

import com.monarca.audit.domain.AuditAction
import com.monarca.audit.repository.gravarAuditLog
import com.monarca.caixa.domain.TipoMovimentacaoCaixa
import com.monarca.caixa.repository.CaixaMovimentacaoFinalizadoresTable
import com.monarca.cotacao.repository.CotacoesTable
import com.monarca.caixa.repository.CaixaMovimentacoesTable
import com.monarca.caixa.repository.FinalizadoresTable
import com.monarca.common.enums.Status
import com.monarca.empresa.repository.FiliaisTable
import com.monarca.estoque.repository.EstoqueProdutosTable
import com.monarca.estoque.repository.EstoquesTable
import com.monarca.estoque.repository.registrarMovimentoEstoque
import com.monarca.localidade.repository.CidadesTable
import com.monarca.pessoa.repository.ClientesTable
import com.monarca.pessoa.repository.PessoaEnderecosTable
import com.monarca.pessoa.repository.PessoasTable
import com.monarca.produto.domain.SituacaoUnidade
import com.monarca.produto.repository.ProdutoUnidadesTable
import com.monarca.produto.repository.ProdutosTable
import com.monarca.usuario.repository.UsuariosTable
import com.monarca.localidade.service.invalido
import com.monarca.titulo.domain.StatusParcela
import com.monarca.titulo.domain.StatusTitulo
import com.monarca.titulo.repository.ParcelasReceberTable
import com.monarca.titulo.repository.TituloReceberNovo
import com.monarca.titulo.repository.TitulosReceberTable
import com.monarca.venda.domain.StatusVenda
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.singleOrNull
import kotlinx.coroutines.flow.toList
import org.jetbrains.exposed.v1.core.JoinType
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.inList
import org.jetbrains.exposed.v1.core.neq
import org.jetbrains.exposed.v1.r2dbc.R2dbcDatabase
import org.jetbrains.exposed.v1.r2dbc.deleteWhere
import org.jetbrains.exposed.v1.r2dbc.insert
import org.jetbrains.exposed.v1.r2dbc.selectAll
import org.jetbrains.exposed.v1.r2dbc.transactions.suspendTransaction
import org.jetbrains.exposed.v1.r2dbc.update

class ExposedVendaRepository(
    private val database: R2dbcDatabase,
) : VendaRepository {

    override suspend fun listar(idFilial: Long): List<VendaCompleta> = suspendTransaction(database) {
        val cabecalhos = queryVendas()
            .where { (VendasTable.idFilial eq idFilial) and (VendasTable.status neq Status.DELETADO.name.lowercase()) }
            .orderBy(VendasTable.criadoEm to SortOrder.DESC)
            .toList()
        cabecalhos.map { completar(it) }
    }

    override suspend fun buscar(id: Long): VendaCompleta? = suspendTransaction(database) {
        queryVendas()
            .where { (VendasTable.id eq id) and (VendasTable.status neq Status.DELETADO.name.lowercase()) }
            .singleOrNull()
            ?.let { completar(it) }
    }

    override suspend fun inserir(
        idFilial: Long,
        idCliente: Long,
        idVendedor: Long,
        idCaixaSessao: Long?,
        idCotacao: Long,
        totalPyg: Double,
        descontoPct: Double,
        descontoPyg: Double,
        observacao: String?,
        itens: List<VendaItemPersistencia>,
        negociacao: List<VendaNegociacaoPersistencia>,
        negociacaoCaixa: List<VendaNegociacaoPersistencia>,
        tituloReceber: com.monarca.titulo.repository.TituloReceberNovo?,
        idUsuario: Long,
        status: String,
        validade: String?,
        efetivar: Boolean,
        idsOrcamentos: List<Long>,
        hoje: String,
        confirmarVencido: Boolean,
    ): Long = suspendTransaction(database) {
        val agora = System.currentTimeMillis()
        val inserted = VendasTable.insert {
            it[VendasTable.idFilial] = idFilial
            it[VendasTable.idCliente] = idCliente
            it[VendasTable.idVendedor] = idVendedor
            it[VendasTable.idCaixaSessao] = idCaixaSessao
            it[VendasTable.idCotacao] = idCotacao
            it[VendasTable.totalPyg] = totalPyg
            it[VendasTable.descontoPct] = descontoPct
            it[VendasTable.descontoPyg] = descontoPyg
            it[VendasTable.observacao] = observacao
            it[VendasTable.validade] = validade
            it[VendasTable.criadoEm] = agora
            it[VendasTable.status] = status
        }
        val idVenda = inserted[VendasTable.id].value
        gravarCorpo(idVenda, idCaixaSessao, agora, itens, negociacao, negociacaoCaixa, tituloReceber, idUsuario, efetivar)
        if (efetivar) consumirOrcamentos(idsOrcamentos, idVenda, idFilial, idCliente, hoje, confirmarVencido)
        gravarAuditLog("venda", idVenda.toString(), AuditAction.INSERT, newValues = """{"totalPyg":$totalPyg,"status":"$status"}""")
        idVenda
    }

    override suspend fun cancelar(id: Long) {
        suspendTransaction(database) {
            val n = VendasTable.update({
                (VendasTable.id eq id) and (VendasTable.status inList listOf("aberta", "orcamento"))
            }) {
                it[VendasTable.status] = StatusVenda.CANCELADA.name.lowercase()
            }
            if (n != 1) throw invalido("VENDA_NAO_CANCELAVEL", "Só um orçamento ou uma venda em aberto pode ser cancelada")
            gravarAuditLog("venda", id.toString(), AuditAction.UPDATE, newValues = """{"status":"cancelada"}""")
        }
    }

    private suspend fun consumirOrcamentos(
        ids: List<Long>,
        idVenda: Long,
        idFilial: Long,
        idCliente: Long,
        hoje: String,
        confirmarVencido: Boolean,
    ) {
        val distintos = ids.distinct()
        if (distintos.isEmpty()) return
        val rows = VendasTable.selectAll().where { VendasTable.id inList distintos }.toList()
        if (rows.size != distintos.size) {
            throw invalido("ORCAMENTO_INDISPONIVEL", "Um dos orçamentos não está mais disponível")
        }
        for (row in rows) {
            val status = row[VendasTable.status]
            val mesmaOrigem = row[VendasTable.idFilial].value == idFilial && row[VendasTable.idCliente].value == idCliente
            if (status != StatusVenda.ORCAMENTO.name.lowercase() || !mesmaOrigem) {
                if (!mesmaOrigem) throw invalido("ORCAMENTO_CLIENTE", "Os orçamentos precisam ser do mesmo cliente desta filial")
                throw invalido("ORCAMENTO_INDISPONIVEL", "Um dos orçamentos não está mais disponível")
            }
            val validade = row[VendasTable.validade]
            if (validade != null && validade < hoje && !confirmarVencido) {
                throw invalido("ORCAMENTO_VENCIDO", "O orçamento venceu. Confirme para converter com a cotação de hoje")
            }
        }
        val n = VendasTable.update({
            (VendasTable.id inList distintos) and (VendasTable.status eq StatusVenda.ORCAMENTO.name.lowercase())
        }) {
            it[VendasTable.status] = StatusVenda.UTILIZADA.name.lowercase()
            it[VendasTable.idVendaGerada] = idVenda
        }
        if (n != distintos.size) throw invalido("ORCAMENTO_INDISPONIVEL", "Um dos orçamentos não está mais disponível")
        for (idOrc in distintos) {
            gravarAuditLog("venda", idOrc.toString(), AuditAction.UPDATE, newValues = """{"status":"utilizada","idVendaGerada":$idVenda}""")
        }
    }

    private suspend fun gravarCorpo(
        idVenda: Long,
        idCaixaSessao: Long?,
        agora: Long,
        itens: List<VendaItemPersistencia>,
        negociacao: List<VendaNegociacaoPersistencia>,
        negociacaoCaixa: List<VendaNegociacaoPersistencia>,
        tituloReceber: com.monarca.titulo.repository.TituloReceberNovo?,
        idUsuario: Long,
        efetivar: Boolean,
    ) {
        for (item in itens) {
            val insertedItem = VendaItensTable.insert {
                it[VendaItensTable.idVenda] = idVenda
                it[VendaItensTable.idProduto] = item.idProduto
                it[VendaItensTable.idEstoque] = item.idEstoque
                it[VendaItensTable.quantidade] = item.quantidade
                it[VendaItensTable.aliquotaIva] = item.aliquotaIva
                it[VendaItensTable.moedaPreco] = item.moedaPreco
                it[VendaItensTable.precoLista] = item.precoLista
                it[VendaItensTable.precoUnitarioPyg] = item.precoUnitarioPyg
                it[VendaItensTable.descontoPct] = item.descontoPct
                it[VendaItensTable.descontoPyg] = item.descontoPyg
                it[VendaItensTable.totalPyg] = item.totalPyg
            }
            val idItem = insertedItem[VendaItensTable.id].value
            if (!efetivar) continue
            for (idUnidade in item.idsUnidades) {
                VendaItemUnidadesTable.insert {
                    it[VendaItemUnidadesTable.idVendaItem] = idItem
                    it[VendaItemUnidadesTable.idProdutoUnidade] = idUnidade
                }
                val n = ProdutoUnidadesTable.update({
                    (ProdutoUnidadesTable.id eq idUnidade) and
                        (ProdutoUnidadesTable.situacao eq SituacaoUnidade.DISPONIVEL.name.lowercase())
                }) {
                    it[situacao] = SituacaoUnidade.VENDIDO.name.lowercase()
                    it[idVendaItem] = idItem
                }
                if (n == 0) {
                    throw invalido("UNIDADE_INDISPONIVEL", "O chassi não está disponível")
                }
            }
            val saldo = EstoqueProdutosTable.selectAll()
                .where {
                    (EstoqueProdutosTable.idEstoque eq item.idEstoque) and
                        (EstoqueProdutosTable.idProduto eq item.idProduto) and
                        (EstoqueProdutosTable.status neq Status.DELETADO.name.lowercase())
                }
                .singleOrNull()
                ?: throw invalido("ESTOQUE_PRODUTO_AUSENTE", "Produto sem saldo neste estoque")
            val qtd = saldo[EstoqueProdutosTable.quantidade]
            val reservada = saldo[EstoqueProdutosTable.quantidadeReservada]
            if (qtd - reservada < item.quantidade) {
                throw invalido("ESTOQUE_INSUFICIENTE", "Saldo insuficiente para vender")
            }
            val saldoDepois = qtd - item.quantidade
            EstoqueProdutosTable.update({ EstoqueProdutosTable.id eq saldo[EstoqueProdutosTable.id].value }) {
                it[quantidade] = saldoDepois
            }
            registrarMovimentoEstoque(
                idEstoque = item.idEstoque,
                idProduto = item.idProduto,
                tipo = "venda",
                quantidade = -item.quantidade,
                saldoDepois = saldoDepois,
                idDocumento = idVenda,
                idUsuario = idUsuario,
            )
        }
        for (linha in negociacao) {
            VendaNegociacoesTable.insert {
                it[VendaNegociacoesTable.idVenda] = idVenda
                it[VendaNegociacoesTable.idFinalizador] = linha.idFinalizador
                it[VendaNegociacoesTable.moeda] = linha.moeda
                it[VendaNegociacoesTable.valor] = linha.valor
                it[VendaNegociacoesTable.valorPyg] = linha.valorPyg
            }
        }
        if (efetivar && idCaixaSessao != null && negociacaoCaixa.isNotEmpty()) {
            val mov = CaixaMovimentacoesTable.insert {
                it[CaixaMovimentacoesTable.idCaixaSessao] = idCaixaSessao
                it[CaixaMovimentacoesTable.tipo] = TipoMovimentacaoCaixa.VENDA.name.lowercase()
                it[CaixaMovimentacoesTable.idUsuario] = idUsuario
                it[CaixaMovimentacoesTable.idVenda] = idVenda
                it[CaixaMovimentacoesTable.criadoEm] = agora
                it[CaixaMovimentacoesTable.status] = Status.ATIVO.name.lowercase()
            }
            val idMov = mov[CaixaMovimentacoesTable.id].value
            for (linha in negociacaoCaixa) {
                CaixaMovimentacaoFinalizadoresTable.insert {
                    it[CaixaMovimentacaoFinalizadoresTable.idCaixaMovimentacao] = idMov
                    it[CaixaMovimentacaoFinalizadoresTable.idFinalizador] = linha.idFinalizador
                    it[CaixaMovimentacaoFinalizadoresTable.moeda] = linha.moeda
                    it[CaixaMovimentacaoFinalizadoresTable.valor] = linha.valor
                    it[CaixaMovimentacaoFinalizadoresTable.valorPyg] = linha.valorPyg
                }
            }
        }
        if (efetivar && tituloReceber != null) {
            val insertedTitulo = TitulosReceberTable.insert {
                it[TitulosReceberTable.idFilial] = tituloReceber.idFilial
                it[TitulosReceberTable.idCliente] = tituloReceber.idCliente
                it[TitulosReceberTable.origem] = tituloReceber.origem.name.lowercase()
                it[TitulosReceberTable.idVenda] = idVenda
                it[TitulosReceberTable.moeda] = tituloReceber.moeda.name.lowercase()
                it[TitulosReceberTable.valor] = tituloReceber.valor
                it[TitulosReceberTable.valorPyg] = tituloReceber.valorPyg
                it[TitulosReceberTable.idCotacao] = tituloReceber.idCotacao
                it[TitulosReceberTable.usdPyg] = tituloReceber.usdPyg
                it[TitulosReceberTable.brlPyg] = tituloReceber.brlPyg
                it[TitulosReceberTable.observacao] = tituloReceber.observacao
                it[TitulosReceberTable.criadoEm] = agora
                it[TitulosReceberTable.status] = StatusTitulo.ABERTO.name.lowercase()
            }
            val idTitulo = insertedTitulo[TitulosReceberTable.id].value
            for (p in tituloReceber.parcelas) {
                ParcelasReceberTable.insert {
                    it[ParcelasReceberTable.idTitulo] = idTitulo
                    it[ParcelasReceberTable.numero] = p.numero
                    it[ParcelasReceberTable.vencimento] = p.vencimento
                    it[ParcelasReceberTable.valor] = p.valor
                    it[ParcelasReceberTable.valorPyg] = p.valorPyg
                    it[ParcelasReceberTable.saldo] = p.valor
                    it[ParcelasReceberTable.status] = StatusParcela.ABERTA.name.lowercase()
                }
            }
            gravarAuditLog("titulo_receber", idTitulo.toString(), AuditAction.INSERT, newValues = """{"idVenda":$idVenda}""")
        }
    }

    override suspend fun efetivar(
        idVenda: Long,
        idCaixaSessao: Long,
        idCotacao: Long,
        totalPyg: Double,
        descontoPct: Double,
        descontoPyg: Double,
        observacao: String?,
        itens: List<VendaItemPersistencia>,
        negociacao: List<VendaNegociacaoPersistencia>,
        negociacaoCaixa: List<VendaNegociacaoPersistencia>,
        tituloReceber: com.monarca.titulo.repository.TituloReceberNovo?,
        idUsuario: Long,
    ) = suspendTransaction(database) {
        val apagados = VendaItensTable.selectAll().where { VendaItensTable.idVenda eq idVenda }.map { it[VendaItensTable.id].value }.toList()
        if (apagados.isNotEmpty()) {
            VendaItemUnidadesTable.deleteWhere { VendaItemUnidadesTable.idVendaItem inList apagados }
        }
        VendaNegociacoesTable.deleteWhere { VendaNegociacoesTable.idVenda eq idVenda }
        VendaItensTable.deleteWhere { VendaItensTable.idVenda eq idVenda }
        VendasTable.update({ VendasTable.id eq idVenda }) {
            it[VendasTable.idCaixaSessao] = idCaixaSessao
            it[VendasTable.idCotacao] = idCotacao
            it[VendasTable.totalPyg] = totalPyg
            it[VendasTable.descontoPct] = descontoPct
            it[VendasTable.descontoPyg] = descontoPyg
            it[VendasTable.observacao] = observacao
            it[VendasTable.status] = StatusVenda.FINALIZADA.name.lowercase()
        }
        val agora = System.currentTimeMillis()
        gravarCorpo(idVenda, idCaixaSessao, agora, itens, negociacao, negociacaoCaixa, tituloReceber, idUsuario, true)
        gravarAuditLog("venda", idVenda.toString(), AuditAction.UPDATE, newValues = """{"status":"finalizada","totalPyg":$totalPyg}""")
    }

    private fun queryVendas() = VendasTable
        .innerJoin(FiliaisTable)
        .join(ClientesTable, JoinType.INNER, VendasTable.idCliente, ClientesTable.id)
        .join(PessoasTable, JoinType.INNER, ClientesTable.idPessoa, PessoasTable.id)
        .join(UsuariosTable, JoinType.INNER, VendasTable.idVendedor, UsuariosTable.id)
        .join(CotacoesTable, JoinType.INNER, VendasTable.idCotacao, CotacoesTable.id)
        .selectAll()

    private suspend fun completar(row: ResultRow): VendaCompleta {
        val idVenda = row[VendasTable.id].value
        val itens = VendaItensTable
            .join(ProdutosTable, JoinType.INNER, VendaItensTable.idProduto, ProdutosTable.id)
            .join(EstoquesTable, JoinType.INNER, VendaItensTable.idEstoque, EstoquesTable.id)
            .selectAll()
            .where { VendaItensTable.idVenda eq idVenda }
            .map {
                VendaItemPersistencia(
                    id = it[VendaItensTable.id].value,
                    idProduto = it[VendaItensTable.idProduto].value,
                    produtoCodigo = it[ProdutosTable.codigo],
                    produtoNome = it[ProdutosTable.nome],
                    idEstoque = it[VendaItensTable.idEstoque].value,
                    estoqueNome = it[EstoquesTable.nome],
                    quantidade = it[VendaItensTable.quantidade],
                    aliquotaIva = it[VendaItensTable.aliquotaIva],
                    moedaPreco = it[VendaItensTable.moedaPreco],
                    precoLista = it[VendaItensTable.precoLista],
                    precoUnitarioPyg = it[VendaItensTable.precoUnitarioPyg],
                    descontoPct = it[VendaItensTable.descontoPct],
                    descontoPyg = it[VendaItensTable.descontoPyg],
                    totalPyg = it[VendaItensTable.totalPyg],
                )
            }
            .toList()
        val chassisPorItem = if (itens.isEmpty()) {
            emptyMap()
        } else {
            VendaItemUnidadesTable
                .join(ProdutoUnidadesTable, JoinType.INNER, VendaItemUnidadesTable.idProdutoUnidade, ProdutoUnidadesTable.id)
                .selectAll()
                .where { VendaItemUnidadesTable.idVendaItem inList itens.map { it.id } }
                .toList()
                .groupBy { it[VendaItemUnidadesTable.idVendaItem].value }
                .mapValues { (_, rows) -> rows.map { it[ProdutoUnidadesTable.numero] }.sorted() }
        }
        val itensComChassi = itens.map { it.copy(chassis = chassisPorItem[it.id].orEmpty()) }
        val linhasNegociacao = VendaNegociacoesTable
            .innerJoin(FinalizadoresTable)
            .selectAll()
            .where { VendaNegociacoesTable.idVenda eq idVenda }
            .toList()
        val qtdParcelas = if (linhasNegociacao.any { it[FinalizadoresTable.geraContasReceber] }) {
            ParcelasReceberTable
                .innerJoin(TitulosReceberTable)
                .selectAll()
                .where { TitulosReceberTable.idVenda eq idVenda }
                .toList()
                .size
        } else {
            0
        }
        val negociacao = linhasNegociacao.map {
            val aPrazo = it[FinalizadoresTable.geraContasReceber]
            VendaNegociacaoPersistencia(
                id = it[VendaNegociacoesTable.id].value,
                idFinalizador = it[VendaNegociacoesTable.idFinalizador].value,
                finalizadorNome = it[FinalizadoresTable.nome],
                moeda = it[VendaNegociacoesTable.moeda],
                valor = it[VendaNegociacoesTable.valor],
                valorPyg = it[VendaNegociacoesTable.valorPyg],
                quantidadeParcelas = if (aPrazo && qtdParcelas > 0) qtdParcelas else null,
            )
        }
        return VendaCompleta(
            id = idVenda,
            idFilial = row[VendasTable.idFilial].value,
            filialNome = row[FiliaisTable.nome],
            idCliente = row[VendasTable.idCliente].value,
            clienteNome = row[PessoasTable.nomeRazaoSocial],
            idVendedor = row[VendasTable.idVendedor].value,
            vendedorNome = row[UsuariosTable.nome],
            idCaixaSessao = row[VendasTable.idCaixaSessao]?.value ?: 0L,
            idCotacao = row[VendasTable.idCotacao].value,
            clienteTelefone = telefoneCliente(row[PessoasTable.ddi], row[PessoasTable.telefone]),
            clienteEndereco = enderecoCliente(row[ClientesTable.idPessoa].value),
            validade = row[VendasTable.validade],
            idVendaGerada = row[VendasTable.idVendaGerada],
            usdPyg = row[CotacoesTable.usdPyg],
            brlPyg = row[CotacoesTable.brlPyg],
            totalPyg = row[VendasTable.totalPyg],
            descontoPct = row[VendasTable.descontoPct],
            descontoPyg = row[VendasTable.descontoPyg],
            observacao = row[VendasTable.observacao],
            criadoEm = row[VendasTable.criadoEm],
            status = row[VendasTable.status],
            itens = itensComChassi,
            negociacao = negociacao,
        )
    }

    private fun telefoneCliente(ddi: String?, telefone: String?): String? {
        val numero = telefone?.trim()?.ifBlank { null } ?: return null
        val prefixo = ddi?.trim()?.ifBlank { null }
        return if (prefixo == null) numero else "+$prefixo $numero"
    }

    private suspend fun enderecoCliente(idPessoa: Long): String? {
        val row = PessoaEnderecosTable
            .join(CidadesTable, JoinType.LEFT, PessoaEnderecosTable.idCidade, CidadesTable.id)
            .selectAll()
            .where {
                (PessoaEnderecosTable.idPessoa eq idPessoa) and
                    (PessoaEnderecosTable.status eq Status.ATIVO.name.lowercase())
            }
            .orderBy(PessoaEnderecosTable.principal to SortOrder.DESC, PessoaEnderecosTable.id to SortOrder.ASC)
            .toList()
            .firstOrNull()
            ?: return null
        val rua = listOfNotNull(row[PessoaEnderecosTable.tipoLogradouro], row[PessoaEnderecosTable.logradouro])
            .map { it.trim() }
            .filter { it.isNotEmpty() }
            .joinToString(" ")
        val numero = row[PessoaEnderecosTable.numero]?.trim()?.ifBlank { null }
        val linha = listOfNotNull(rua.ifBlank { null }, numero).joinToString(", ")
        val bairro = row[PessoaEnderecosTable.bairro]?.trim()?.ifBlank { null }
        val cidade = row.getOrNull(CidadesTable.nome)?.trim()?.ifBlank { null }
        val texto = listOfNotNull(linha.ifBlank { null }, bairro, cidade).joinToString(" · ")
        return texto.ifBlank { null }
    }
}
