package com.monarca.venda.repository

import com.monarca.audit.domain.AuditAction
import com.monarca.audit.repository.gravarAuditLog
import com.monarca.caixa.domain.TipoMovimentacaoCaixa
import com.monarca.caixa.repository.CaixaMovimentacaoFinalizadoresTable
import com.monarca.caixa.repository.CaixaMovimentacoesTable
import com.monarca.caixa.repository.FinalizadoresTable
import com.monarca.common.enums.Status
import com.monarca.empresa.repository.FiliaisTable
import com.monarca.estoque.repository.EstoqueProdutosTable
import com.monarca.estoque.repository.EstoquesTable
import com.monarca.pessoa.repository.ClientesTable
import com.monarca.pessoa.repository.PessoasTable
import com.monarca.produto.repository.ProdutosTable
import com.monarca.usuario.repository.UsuariosTable
import com.monarca.localidade.service.invalido
import com.monarca.venda.domain.StatusVenda
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.singleOrNull
import kotlinx.coroutines.flow.toList
import org.jetbrains.exposed.v1.core.JoinType
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.neq
import org.jetbrains.exposed.v1.r2dbc.R2dbcDatabase
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
        idCaixaSessao: Long,
        idCotacao: Long,
        totalPyg: Double,
        observacao: String?,
        itens: List<VendaItemPersistencia>,
        negociacao: List<VendaNegociacaoPersistencia>,
        idUsuario: Long,
    ): Long = suspendTransaction(database) {
        val agora = System.currentTimeMillis()
        val inserted = VendasTable.insert {
            it[VendasTable.idFilial] = idFilial
            it[VendasTable.idCliente] = idCliente
            it[VendasTable.idVendedor] = idVendedor
            it[VendasTable.idCaixaSessao] = idCaixaSessao
            it[VendasTable.idCotacao] = idCotacao
            it[VendasTable.totalPyg] = totalPyg
            it[VendasTable.observacao] = observacao
            it[VendasTable.criadoEm] = agora
            it[VendasTable.status] = StatusVenda.FINALIZADA.name.lowercase()
        }
        val idVenda = inserted[VendasTable.id].value
        for (item in itens) {
            VendaItensTable.insert {
                it[VendaItensTable.idVenda] = idVenda
                it[VendaItensTable.idProduto] = item.idProduto
                it[VendaItensTable.idEstoque] = item.idEstoque
                it[VendaItensTable.quantidade] = item.quantidade
                it[VendaItensTable.aliquotaIva] = item.aliquotaIva
                it[VendaItensTable.moedaPreco] = item.moedaPreco
                it[VendaItensTable.precoLista] = item.precoLista
                it[VendaItensTable.precoUnitarioPyg] = item.precoUnitarioPyg
                it[VendaItensTable.totalPyg] = item.totalPyg
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
            EstoqueProdutosTable.update({ EstoqueProdutosTable.id eq saldo[EstoqueProdutosTable.id].value }) {
                it[quantidade] = qtd - item.quantidade
            }
        }
        for (linha in negociacao) {
            VendaNegociacoesTable.insert {
                it[VendaNegociacoesTable.idVenda] = idVenda
                it[VendaNegociacoesTable.idFinalizador] = linha.idFinalizador
                it[VendaNegociacoesTable.valor] = linha.valor
            }
        }
        val mov = CaixaMovimentacoesTable.insert {
            it[CaixaMovimentacoesTable.idCaixaSessao] = idCaixaSessao
            it[CaixaMovimentacoesTable.tipo] = TipoMovimentacaoCaixa.VENDA.name.lowercase()
            it[CaixaMovimentacoesTable.idUsuario] = idUsuario
            it[CaixaMovimentacoesTable.idVenda] = idVenda
            it[CaixaMovimentacoesTable.criadoEm] = agora
            it[CaixaMovimentacoesTable.status] = Status.ATIVO.name.lowercase()
        }
        val idMov = mov[CaixaMovimentacoesTable.id].value
        for (linha in negociacao) {
            CaixaMovimentacaoFinalizadoresTable.insert {
                it[CaixaMovimentacaoFinalizadoresTable.idCaixaMovimentacao] = idMov
                it[CaixaMovimentacaoFinalizadoresTable.idFinalizador] = linha.idFinalizador
                it[CaixaMovimentacaoFinalizadoresTable.valor] = linha.valor
            }
        }
        gravarAuditLog("venda", idVenda.toString(), AuditAction.INSERT, newValues = """{"totalPyg":$totalPyg}""")
        idVenda
    }

    private fun queryVendas() = VendasTable
        .innerJoin(FiliaisTable)
        .join(ClientesTable, JoinType.INNER, VendasTable.idCliente, ClientesTable.id)
        .join(PessoasTable, JoinType.INNER, ClientesTable.idPessoa, PessoasTable.id)
        .join(UsuariosTable, JoinType.INNER, VendasTable.idVendedor, UsuariosTable.id)
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
                    totalPyg = it[VendaItensTable.totalPyg],
                )
            }
            .toList()
        val negociacao = VendaNegociacoesTable
            .innerJoin(FinalizadoresTable)
            .selectAll()
            .where { VendaNegociacoesTable.idVenda eq idVenda }
            .map {
                VendaNegociacaoPersistencia(
                    id = it[VendaNegociacoesTable.id].value,
                    idFinalizador = it[VendaNegociacoesTable.idFinalizador].value,
                    finalizadorNome = it[FinalizadoresTable.nome],
                    valor = it[VendaNegociacoesTable.valor],
                )
            }
            .toList()
        return VendaCompleta(
            id = idVenda,
            idFilial = row[VendasTable.idFilial].value,
            filialNome = row[FiliaisTable.nome],
            idCliente = row[VendasTable.idCliente].value,
            clienteNome = row[PessoasTable.nomeRazaoSocial],
            idVendedor = row[VendasTable.idVendedor].value,
            vendedorNome = row[UsuariosTable.nome],
            idCaixaSessao = row[VendasTable.idCaixaSessao].value,
            idCotacao = row[VendasTable.idCotacao].value,
            totalPyg = row[VendasTable.totalPyg],
            observacao = row[VendasTable.observacao],
            criadoEm = row[VendasTable.criadoEm],
            status = row[VendasTable.status],
            itens = itens,
            negociacao = negociacao,
        )
    }
}
