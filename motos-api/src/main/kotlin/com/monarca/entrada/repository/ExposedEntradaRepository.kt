package com.monarca.entrada.repository

import com.monarca.audit.domain.AuditAction
import com.monarca.audit.repository.gravarAuditLog
import com.monarca.caixa.domain.TipoMovimentacaoCaixa
import com.monarca.caixa.repository.CaixaMovimentacaoFinalizadoresTable
import com.monarca.caixa.repository.CaixaMovimentacoesTable
import com.monarca.caixa.repository.FinalizadoresTable
import com.monarca.common.enums.Status
import com.monarca.empresa.repository.FiliaisTable
import com.monarca.entrada.domain.CondicionEntrada
import com.monarca.entrada.domain.StatusEntrada
import com.monarca.entrada.domain.TipoDocumentoEntrada
import com.monarca.estoque.repository.EstoqueProdutosTable
import com.monarca.estoque.repository.EstoquesTable
import com.monarca.pessoa.repository.FornecedoresTable
import com.monarca.pessoa.repository.PessoasTable
import com.monarca.produto.domain.Moeda
import com.monarca.produto.domain.SituacaoUnidade
import com.monarca.produto.repository.ProdutoUnidadesTable
import com.monarca.produto.repository.ProdutosTable
import com.monarca.titulo.domain.StatusParcela
import com.monarca.titulo.domain.StatusTitulo
import com.monarca.titulo.repository.ParcelasPagarTable
import com.monarca.titulo.repository.TitulosPagarTable
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
import org.jetbrains.exposed.v1.r2dbc.insert
import org.jetbrains.exposed.v1.r2dbc.selectAll
import org.jetbrains.exposed.v1.r2dbc.transactions.suspendTransaction
import org.jetbrains.exposed.v1.r2dbc.update

class ExposedEntradaRepository(
    private val database: R2dbcDatabase,
) : EntradaRepository {

    override suspend fun listar(idFilial: Long): List<EntradaCompleta> = suspendTransaction(database) {
        queryCabecalho()
            .where {
                (EntradasTable.idFilial eq idFilial) and
                    (EntradasTable.status neq StatusEntrada.CANCELADA.name.lowercase())
            }
            .orderBy(EntradasTable.criadoEm to SortOrder.DESC)
            .map { it[EntradasTable.id].value }
            .toList()
            .mapNotNull { completar(it) }
    }

    override suspend fun buscar(id: Long): EntradaCompleta? = suspendTransaction(database) {
        completar(id)
    }

    override suspend fun existePyDuplicada(
        idFilial: Long,
        idFornecedor: Long,
        timbrado: String,
        establecimiento: String,
        puntoExpedicion: String,
        numero: String,
    ): Boolean = suspendTransaction(database) {
        EntradasTable.selectAll()
            .where {
                (EntradasTable.idFilial eq idFilial) and
                    (EntradasTable.idFornecedor eq idFornecedor) and
                    (EntradasTable.tipoDocumento eq TipoDocumentoEntrada.PY_FACTURA.name.lowercase()) and
                    (EntradasTable.timbrado eq timbrado) and
                    (EntradasTable.establecimiento eq establecimiento) and
                    (EntradasTable.puntoExpedicion eq puntoExpedicion) and
                    (EntradasTable.numero eq numero) and
                    (EntradasTable.status neq StatusEntrada.CANCELADA.name.lowercase())
            }
            .toList()
            .isNotEmpty()
    }

    override suspend fun inserir(entrada: EntradaNova): Long = suspendTransaction(database) {
        val agora = System.currentTimeMillis()
        val inserted = EntradasTable.insert {
            it[idFilial] = entrada.idFilial
            it[idFornecedor] = entrada.idFornecedor
            it[tipoDocumento] = entrada.tipoDocumento.name.lowercase()
            it[dataEmissao] = entrada.dataEmissao
            it[moeda] = entrada.moeda.name.lowercase()
            it[valor] = entrada.valor
            it[valorPyg] = entrada.valorPyg
            it[idCotacao] = entrada.idCotacao
            it[usdPyg] = entrada.usdPyg
            it[brlPyg] = entrada.brlPyg
            it[timbrado] = entrada.timbrado
            it[establecimiento] = entrada.establecimiento
            it[puntoExpedicion] = entrada.puntoExpedicion
            it[numero] = entrada.numero
            it[cdc] = entrada.cdc
            it[condicion] = entrada.condicion?.name?.lowercase()
            it[numeroDocumento] = entrada.numeroDocumento
            it[incoterm] = entrada.incoterm
            it[idCaixaSessao] = entrada.idCaixaSessao
            it[observacao] = entrada.observacao
            it[criadoEm] = agora
            it[status] = StatusEntrada.FINALIZADA.name.lowercase()
        }
        val idEntrada = inserted[EntradasTable.id].value

        for (item in entrada.itens) {
            val insertedItem = EntradaItensTable.insert {
                it[EntradaItensTable.idEntrada] = idEntrada
                it[idProduto] = item.idProduto
                it[idEstoque] = item.idEstoque
                it[quantidade] = item.quantidade
                it[aliquotaIva] = item.aliquotaIva
                it[moeda] = item.moeda.name.lowercase()
                it[valorUnitario] = item.valorUnitario
                it[valor] = item.valor
                it[valorPyg] = item.valorPyg
            }
            val idItem = insertedItem[EntradaItensTable.id].value

            if (item.numerosChassis.isNotEmpty()) {
                for (numeroChassi in item.numerosChassis) {
                    val unidade = ProdutoUnidadesTable.insert {
                        it[idProduto] = item.idProduto
                        it[idEstoque] = item.idEstoque
                        it[numero] = numeroChassi
                        it[situacao] = SituacaoUnidade.DISPONIVEL.name.lowercase()
                        it[status] = Status.ATIVO.name.lowercase()
                    }
                    val idUnidade = unidade[ProdutoUnidadesTable.id].value
                    EntradaItemUnidadesTable.insert {
                        it[idEntradaItem] = idItem
                        it[idProdutoUnidade] = idUnidade
                    }
                }
                sincronizarQtdChassi(item.idProduto, item.idEstoque)
            } else {
                aumentarEstoque(item.idProduto, item.idEstoque, item.quantidade)
            }
        }

        for (linha in entrada.negociacao) {
            EntradaNegociacoesTable.insert {
                it[EntradaNegociacoesTable.idEntrada] = idEntrada
                it[EntradaNegociacoesTable.idFinalizador] = linha.idFinalizador
                it[EntradaNegociacoesTable.moeda] = linha.moeda
                it[EntradaNegociacoesTable.valor] = linha.valor
                it[EntradaNegociacoesTable.valorPyg] = linha.valorPyg
            }
        }

        if (entrada.negociacaoCaixa.isNotEmpty() && entrada.idCaixaSessao != null) {
            val mov = CaixaMovimentacoesTable.insert {
                it[CaixaMovimentacoesTable.idCaixaSessao] = entrada.idCaixaSessao
                it[CaixaMovimentacoesTable.tipo] = TipoMovimentacaoCaixa.PAGAMENTO.name.lowercase()
                it[CaixaMovimentacoesTable.idUsuario] = entrada.idUsuario
                it[CaixaMovimentacoesTable.idEntrada] = idEntrada
                it[CaixaMovimentacoesTable.criadoEm] = agora
                it[CaixaMovimentacoesTable.status] = Status.ATIVO.name.lowercase()
            }
            val idMov = mov[CaixaMovimentacoesTable.id].value
            for (linha in entrada.negociacaoCaixa) {
                CaixaMovimentacaoFinalizadoresTable.insert {
                    it[idCaixaMovimentacao] = idMov
                    it[idFinalizador] = linha.idFinalizador
                    it[moeda] = linha.moeda
                    it[valor] = linha.valor
                    it[valorPyg] = linha.valorPyg
                }
            }
        }

        val titulo = entrada.tituloPagar
        if (titulo != null) {
            val insertedTitulo = TitulosPagarTable.insert {
                it[TitulosPagarTable.idFilial] = titulo.idFilial
                it[TitulosPagarTable.idFornecedor] = titulo.idFornecedor
                it[TitulosPagarTable.origem] = titulo.origem.name.lowercase()
                it[TitulosPagarTable.idEntrada] = idEntrada
                it[TitulosPagarTable.moeda] = titulo.moeda.name.lowercase()
                it[TitulosPagarTable.valor] = titulo.valor
                it[TitulosPagarTable.valorPyg] = titulo.valorPyg
                it[TitulosPagarTable.idCotacao] = titulo.idCotacao
                it[TitulosPagarTable.usdPyg] = titulo.usdPyg
                it[TitulosPagarTable.brlPyg] = titulo.brlPyg
                it[TitulosPagarTable.observacao] = titulo.observacao
                it[TitulosPagarTable.criadoEm] = agora
                it[TitulosPagarTable.status] = StatusTitulo.ABERTO.name.lowercase()
            }
            val idTitulo = insertedTitulo[TitulosPagarTable.id].value
            for (p in titulo.parcelas) {
                ParcelasPagarTable.insert {
                    it[ParcelasPagarTable.idTitulo] = idTitulo
                    it[ParcelasPagarTable.numero] = p.numero
                    it[ParcelasPagarTable.vencimento] = p.vencimento
                    it[ParcelasPagarTable.valor] = p.valor
                    it[ParcelasPagarTable.valorPyg] = p.valorPyg
                    it[ParcelasPagarTable.saldo] = p.valor
                    it[ParcelasPagarTable.status] = StatusParcela.ABERTA.name.lowercase()
                }
            }
        }

        gravarAuditLog("entrada", idEntrada.toString(), AuditAction.INSERT, newValues = """{"valor":${entrada.valor}}""")
        idEntrada
    }

    private suspend fun aumentarEstoque(idProduto: Long, idEstoque: Long, qtd: Int) {
        val saldo = EstoqueProdutosTable.selectAll()
            .where {
                (EstoqueProdutosTable.idEstoque eq idEstoque) and
                    (EstoqueProdutosTable.idProduto eq idProduto) and
                    (EstoqueProdutosTable.status neq Status.DELETADO.name.lowercase())
            }
            .singleOrNull()
        if (saldo == null) {
            EstoqueProdutosTable.insert {
                it[EstoqueProdutosTable.idEstoque] = idEstoque
                it[EstoqueProdutosTable.idProduto] = idProduto
                it[quantidade] = qtd
                it[quantidadeReservada] = 0
                it[status] = Status.ATIVO.name.lowercase()
            }
        } else {
            val atual = saldo[EstoqueProdutosTable.quantidade]
            EstoqueProdutosTable.update({ EstoqueProdutosTable.id eq saldo[EstoqueProdutosTable.id].value }) {
                it[quantidade] = atual + qtd
            }
        }
    }

    private suspend fun sincronizarQtdChassi(idProduto: Long, idEstoque: Long) {
        val qtd = ProdutoUnidadesTable.selectAll()
            .where {
                (ProdutoUnidadesTable.idProduto eq idProduto) and
                    (ProdutoUnidadesTable.idEstoque eq idEstoque) and
                    (ProdutoUnidadesTable.situacao eq SituacaoUnidade.DISPONIVEL.name.lowercase())
            }
            .toList()
            .size
        val item = EstoqueProdutosTable.selectAll()
            .where {
                (EstoqueProdutosTable.idProduto eq idProduto) and
                    (EstoqueProdutosTable.idEstoque eq idEstoque) and
                    (EstoqueProdutosTable.status neq Status.DELETADO.name.lowercase())
            }
            .singleOrNull()
        if (item == null) {
            EstoqueProdutosTable.insert {
                it[EstoqueProdutosTable.idEstoque] = idEstoque
                it[EstoqueProdutosTable.idProduto] = idProduto
                it[quantidade] = qtd
                it[quantidadeReservada] = 0
                it[status] = Status.ATIVO.name.lowercase()
            }
        } else {
            val reservada = item[EstoqueProdutosTable.quantidadeReservada].coerceAtMost(qtd)
            EstoqueProdutosTable.update({ EstoqueProdutosTable.id eq item[EstoqueProdutosTable.id].value }) {
                it[quantidade] = qtd
                it[quantidadeReservada] = reservada
            }
        }
    }

    private fun queryCabecalho() = EntradasTable
        .join(FiliaisTable, JoinType.INNER, EntradasTable.idFilial, FiliaisTable.id)
        .join(FornecedoresTable, JoinType.INNER, EntradasTable.idFornecedor, FornecedoresTable.id)
        .join(PessoasTable, JoinType.INNER, FornecedoresTable.idPessoa, PessoasTable.id)
        .selectAll()

    private suspend fun completar(id: Long): EntradaCompleta? {
        val row = queryCabecalho()
            .where { EntradasTable.id eq id }
            .singleOrNull() ?: return null

        val itensRows = EntradaItensTable
            .join(ProdutosTable, JoinType.INNER, EntradaItensTable.idProduto, ProdutosTable.id)
            .join(EstoquesTable, JoinType.INNER, EntradaItensTable.idEstoque, EstoquesTable.id)
            .selectAll()
            .where { EntradaItensTable.idEntrada eq id }
            .toList()

        val idsItens = itensRows.map { it[EntradaItensTable.id].value }
        val chassisPorItem = if (idsItens.isEmpty()) {
            emptyMap()
        } else {
            EntradaItemUnidadesTable
                .join(ProdutoUnidadesTable, JoinType.INNER, EntradaItemUnidadesTable.idProdutoUnidade, ProdutoUnidadesTable.id)
                .selectAll()
                .where { EntradaItemUnidadesTable.idEntradaItem inList idsItens }
                .toList()
                .groupBy { it[EntradaItemUnidadesTable.idEntradaItem].value }
                .mapValues { (_, rows) -> rows.map { it[ProdutoUnidadesTable.numero] } }
        }

        val negociacao = EntradaNegociacoesTable
            .join(FinalizadoresTable, JoinType.INNER, EntradaNegociacoesTable.idFinalizador, FinalizadoresTable.id)
            .selectAll()
            .where { EntradaNegociacoesTable.idEntrada eq id }
            .map {
                EntradaNegociacaoCompleta(
                    id = it[EntradaNegociacoesTable.id].value,
                    idFinalizador = it[EntradaNegociacoesTable.idFinalizador].value,
                    finalizadorNome = it[FinalizadoresTable.nome],
                    moeda = Moeda.valueOf(it[EntradaNegociacoesTable.moeda].uppercase()),
                    valor = it[EntradaNegociacoesTable.valor],
                    valorPyg = it[EntradaNegociacoesTable.valorPyg],
                )
            }
            .toList()

        val idTitulo = TitulosPagarTable.selectAll()
            .where { TitulosPagarTable.idEntrada eq id }
            .map { it[TitulosPagarTable.id].value }
            .singleOrNull()

        return row.toCompleta(
            itens = itensRows.map { itemRow ->
                val idItem = itemRow[EntradaItensTable.id].value
                EntradaItemCompleto(
                    id = idItem,
                    idProduto = itemRow[EntradaItensTable.idProduto].value,
                    produtoCodigo = itemRow[ProdutosTable.codigo],
                    produtoNome = itemRow[ProdutosTable.nome],
                    idEstoque = itemRow[EntradaItensTable.idEstoque].value,
                    estoqueNome = itemRow[EstoquesTable.nome],
                    quantidade = itemRow[EntradaItensTable.quantidade],
                    aliquotaIva = itemRow[EntradaItensTable.aliquotaIva],
                    moeda = Moeda.valueOf(itemRow[EntradaItensTable.moeda].uppercase()),
                    valorUnitario = itemRow[EntradaItensTable.valorUnitario],
                    valor = itemRow[EntradaItensTable.valor],
                    valorPyg = itemRow[EntradaItensTable.valorPyg],
                    chassis = chassisPorItem[idItem].orEmpty(),
                )
            },
            negociacao = negociacao,
            idTituloPagar = idTitulo,
        )
    }

    private fun ResultRow.toCompleta(
        itens: List<EntradaItemCompleto>,
        negociacao: List<EntradaNegociacaoCompleta>,
        idTituloPagar: Long?,
    ) = EntradaCompleta(
        id = this[EntradasTable.id].value,
        idFilial = this[EntradasTable.idFilial].value,
        filialNome = this[FiliaisTable.nome],
        idFornecedor = this[EntradasTable.idFornecedor].value,
        fornecedorNome = this[PessoasTable.nomeRazaoSocial],
        tipoDocumento = TipoDocumentoEntrada.valueOf(this[EntradasTable.tipoDocumento].uppercase()),
        dataEmissao = this[EntradasTable.dataEmissao],
        moeda = Moeda.valueOf(this[EntradasTable.moeda].uppercase()),
        valor = this[EntradasTable.valor],
        valorPyg = this[EntradasTable.valorPyg],
        idCotacao = this[EntradasTable.idCotacao].value,
        usdPyg = this[EntradasTable.usdPyg],
        brlPyg = this[EntradasTable.brlPyg],
        timbrado = this[EntradasTable.timbrado],
        establecimiento = this[EntradasTable.establecimiento],
        puntoExpedicion = this[EntradasTable.puntoExpedicion],
        numero = this[EntradasTable.numero],
        cdc = this[EntradasTable.cdc],
        condicion = this[EntradasTable.condicion]?.let { CondicionEntrada.valueOf(it.uppercase()) },
        numeroDocumento = this[EntradasTable.numeroDocumento],
        incoterm = this[EntradasTable.incoterm],
        idCaixaSessao = this[EntradasTable.idCaixaSessao]?.value,
        idTituloPagar = idTituloPagar,
        observacao = this[EntradasTable.observacao],
        criadoEm = this[EntradasTable.criadoEm],
        status = StatusEntrada.valueOf(this[EntradasTable.status].uppercase()),
        itens = itens,
        negociacao = negociacao,
    )
}
