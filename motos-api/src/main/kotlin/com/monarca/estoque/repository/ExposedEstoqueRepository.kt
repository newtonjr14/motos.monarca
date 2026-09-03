package com.monarca.estoque.repository

import com.monarca.common.enums.Status
import com.monarca.empresa.repository.FiliaisTable
import com.monarca.estoque.domain.Estoque
import com.monarca.estoque.domain.EstoqueDetalhe
import com.monarca.estoque.domain.EstoqueProduto
import com.monarca.estoque.domain.EstoqueProdutoDetalhe
import com.monarca.produto.domain.TipoProduto
import com.monarca.produto.repository.ProdutosTable
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.singleOrNull
import kotlinx.coroutines.flow.toList
import org.jetbrains.exposed.v1.core.JoinType
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.greater
import org.jetbrains.exposed.v1.core.neq
import org.jetbrains.exposed.v1.core.or
import org.jetbrains.exposed.v1.r2dbc.R2dbcDatabase
import org.jetbrains.exposed.v1.r2dbc.insert
import org.jetbrains.exposed.v1.r2dbc.selectAll
import org.jetbrains.exposed.v1.r2dbc.transactions.suspendTransaction
import org.jetbrains.exposed.v1.r2dbc.update

class ExposedEstoqueRepository(
    private val database: R2dbcDatabase,
) : EstoqueRepository {

    override suspend fun listar(idFilial: Long): List<EstoqueDetalhe> = suspendTransaction(database) {
        queryEstoques()
            .where { (EstoquesTable.idFilial eq idFilial) and estoquesAtivos() }
            .orderBy(EstoquesTable.nome to SortOrder.ASC)
            .map { it.toDetalhe() }
            .toList()
    }

    override suspend fun buscar(id: Long): EstoqueDetalhe? = suspendTransaction(database) {
        queryEstoques()
            .where { (EstoquesTable.id eq id) and estoquesAtivos() }
            .map { it.toDetalhe() }
            .singleOrNull()
    }

    override suspend fun existeNome(idFilial: Long, nome: String, ignorarId: Long?): Boolean =
        suspendTransaction(database) {
            val idExistente = EstoquesTable.selectAll()
                .where {
                    (EstoquesTable.idFilial eq idFilial) and
                        (EstoquesTable.nome eq nome) and
                        (EstoquesTable.status neq Status.DELETADO.name.lowercase())
                }
                .map { it[EstoquesTable.id].value }
                .singleOrNull()
            idExistente != null && idExistente != ignorarId
        }

    override suspend fun inserir(estoque: Estoque): Long = suspendTransaction(database) {
        val inserted = EstoquesTable.insert {
            it[idFilial] = estoque.idFilial
            it[nome] = estoque.nome
            it[status] = estoque.status.name.lowercase()
        }
        val id = inserted[EstoquesTable.id].value
        EstoqueProdutoSeed.garantirEstoqueNaFilial(id, estoque.idFilial)
        EstoqueProdutoSeed.auditarInsert(
            "estoque",
            id,
            """{"idFilial":${estoque.idFilial},"nome":"${estoque.nome}","status":"${estoque.status.name.lowercase()}"}""",
        )
        id
    }

    override suspend fun atualizar(id: Long, estoque: Estoque): Boolean = suspendTransaction(database) {
        EstoquesTable.update({
            (EstoquesTable.id eq id) and (EstoquesTable.status neq Status.DELETADO.name.lowercase())
        }) {
            it[idFilial] = estoque.idFilial
            it[nome] = estoque.nome
            it[status] = estoque.status.name.lowercase()
        } > 0
    }

    override suspend fun excluir(id: Long): Boolean = suspendTransaction(database) {
        EstoqueProdutosTable.update({
            (EstoqueProdutosTable.idEstoque eq id) and
                (EstoqueProdutosTable.status neq Status.DELETADO.name.lowercase())
        }) {
            it[status] = Status.DELETADO.name.lowercase()
        }
        EstoquesTable.update({
            (EstoquesTable.id eq id) and (EstoquesTable.status neq Status.DELETADO.name.lowercase())
        }) {
            it[status] = Status.DELETADO.name.lowercase()
        } > 0
    }

    override suspend fun excluirPorFilial(idFilial: Long) {
        suspendTransaction(database) {
            EstoquesTable.update({
                (EstoquesTable.idFilial eq idFilial) and
                    (EstoquesTable.status neq Status.DELETADO.name.lowercase())
            }) {
                it[status] = Status.DELETADO.name.lowercase()
            }
        }
    }

    override suspend fun temItens(idEstoque: Long): Boolean = suspendTransaction(database) {
        EstoqueProdutosTable.selectAll()
            .where {
                (EstoqueProdutosTable.idEstoque eq idEstoque) and
                    (EstoqueProdutosTable.status neq Status.DELETADO.name.lowercase()) and
                    ((EstoqueProdutosTable.quantidade greater 0) or (EstoqueProdutosTable.quantidadeReservada greater 0))
            }
            .toList()
            .isNotEmpty()
    }

    override suspend fun temItensNaFilial(idFilial: Long): Boolean = suspendTransaction(database) {
        EstoqueProdutosTable
            .innerJoin(EstoquesTable)
            .selectAll()
            .where {
                (EstoquesTable.idFilial eq idFilial) and
                    (EstoqueProdutosTable.status neq Status.DELETADO.name.lowercase()) and
                    (EstoquesTable.status neq Status.DELETADO.name.lowercase()) and
                    ((EstoqueProdutosTable.quantidade greater 0) or (EstoqueProdutosTable.quantidadeReservada greater 0))
            }
            .toList()
            .isNotEmpty()
    }

    override suspend fun listarItens(idEstoque: Long): List<EstoqueProdutoDetalhe> = suspendTransaction(database) {
        queryItens()
            .where { (EstoqueProdutosTable.idEstoque eq idEstoque) and itensAtivos() }
            .orderBy(ProdutosTable.nome to SortOrder.ASC)
            .toList()
            .map { it.toItemDetalhe() }
    }

    override suspend fun listarItensPorFilial(idFilial: Long): List<EstoqueProdutoDetalhe> = suspendTransaction(database) {
        queryItens()
            .where { (EstoquesTable.idFilial eq idFilial) and itensAtivos() }
            .orderBy(ProdutosTable.nome to SortOrder.ASC)
            .toList()
            .map { it.toItemDetalhe() }
    }

    override suspend fun buscarItem(id: Long): EstoqueProdutoDetalhe? = suspendTransaction(database) {
        queryItens()
            .where { (EstoqueProdutosTable.id eq id) and itensAtivos() }
            .toList()
            .singleOrNull()
            ?.toItemDetalhe()
    }

    override suspend fun buscarItemPorEstoqueProduto(idEstoque: Long, idProduto: Long): EstoqueProdutoDetalhe? =
        suspendTransaction(database) {
            queryItens()
                .where {
                    (EstoqueProdutosTable.idEstoque eq idEstoque) and
                        (EstoqueProdutosTable.idProduto eq idProduto)
                }
                .toList()
                .singleOrNull()
                ?.toItemDetalhe()
        }

    override suspend fun inserirItem(item: EstoqueProduto): Long = suspendTransaction(database) {
        val inserted = EstoqueProdutosTable.insert {
            it[idEstoque] = item.idEstoque
            it[idProduto] = item.idProduto
            it[quantidade] = item.quantidade
            it[quantidadeReservada] = item.quantidadeReservada
            it[status] = item.status.name.lowercase()
        }
        inserted[EstoqueProdutosTable.id].value
    }

    override suspend fun atualizarItem(id: Long, item: EstoqueProduto): Boolean = suspendTransaction(database) {
        EstoqueProdutosTable.update({
            (EstoqueProdutosTable.id eq id) and
                (EstoqueProdutosTable.status neq Status.DELETADO.name.lowercase())
        }) {
            it[idEstoque] = item.idEstoque
            it[idProduto] = item.idProduto
            it[quantidade] = item.quantidade
            it[quantidadeReservada] = item.quantidadeReservada
            it[status] = item.status.name.lowercase()
        } > 0
    }

    override suspend fun excluirItem(id: Long): Boolean = suspendTransaction(database) {
        EstoqueProdutosTable.update({
            (EstoqueProdutosTable.id eq id) and
                (EstoqueProdutosTable.status neq Status.DELETADO.name.lowercase())
        }) {
            it[status] = Status.DELETADO.name.lowercase()
        } > 0
    }

    override suspend fun produtoEmEstoque(idProduto: Long): Boolean = suspendTransaction(database) {
        EstoqueProdutosTable.selectAll()
            .where {
                (EstoqueProdutosTable.idProduto eq idProduto) and
                    (EstoqueProdutosTable.status neq Status.DELETADO.name.lowercase())
            }
            .toList()
            .isNotEmpty()
    }

    private fun queryEstoques() = EstoquesTable.innerJoin(FiliaisTable).selectAll()

    private fun queryItens() = EstoqueProdutosTable
        .join(EstoquesTable, JoinType.INNER, EstoqueProdutosTable.idEstoque, EstoquesTable.id)
        .join(ProdutosTable, JoinType.INNER, EstoqueProdutosTable.idProduto, ProdutosTable.id)
        .join(FiliaisTable, JoinType.INNER, EstoquesTable.idFilial, FiliaisTable.id)
        .selectAll()

    private fun estoquesAtivos() =
        (EstoquesTable.status neq Status.DELETADO.name.lowercase()) and
            (FiliaisTable.status neq Status.DELETADO.name.lowercase())

    private fun itensAtivos() =
        (EstoqueProdutosTable.status neq Status.DELETADO.name.lowercase()) and
            (EstoquesTable.status neq Status.DELETADO.name.lowercase()) and
            (ProdutosTable.status neq Status.DELETADO.name.lowercase())

    private fun ResultRow.toDetalhe() = EstoqueDetalhe(
        estoque = Estoque(
            id = this[EstoquesTable.id].value,
            idFilial = this[EstoquesTable.idFilial].value,
            nome = this[EstoquesTable.nome],
            status = Status.valueOf(this[EstoquesTable.status].uppercase()),
        ),
        filialNome = this[FiliaisTable.nome],
    )

    private fun ResultRow.toItemDetalhe() = EstoqueProdutoDetalhe(
        item = EstoqueProduto(
            id = this[EstoqueProdutosTable.id].value,
            idEstoque = this[EstoqueProdutosTable.idEstoque].value,
            idProduto = this[EstoqueProdutosTable.idProduto].value,
            quantidade = this[EstoqueProdutosTable.quantidade],
            quantidadeReservada = this[EstoqueProdutosTable.quantidadeReservada],
            status = Status.valueOf(this[EstoqueProdutosTable.status].uppercase()),
        ),
        estoqueNome = this[EstoquesTable.nome],
        idFilial = this[EstoquesTable.idFilial].value,
        filialNome = this[FiliaisTable.nome],
        produtoCodigo = this[ProdutosTable.codigo],
        produtoNome = this[ProdutosTable.nome],
        produtoTipo = TipoProduto.valueOf(this[ProdutosTable.tipo].uppercase()),
    )
}
