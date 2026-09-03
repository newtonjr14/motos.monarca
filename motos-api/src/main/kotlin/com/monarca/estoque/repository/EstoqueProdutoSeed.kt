package com.monarca.estoque.repository

import com.monarca.audit.domain.AuditAction
import com.monarca.audit.repository.gravarAuditLog
import com.monarca.common.enums.Status
import com.monarca.produto.repository.ProdutoFilialTable
import com.monarca.produto.repository.ProdutosTable
import kotlinx.coroutines.flow.toList
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.neq
import org.jetbrains.exposed.v1.r2dbc.insert
import org.jetbrains.exposed.v1.r2dbc.selectAll
import org.jetbrains.exposed.v1.r2dbc.update

/**
 * Seed e auditoria para chamar **dentro** de um `suspendTransaction` já aberto.
 * Qualquer falha propaga e aborta o commit (produto/estoque + `audit_logs`).
 */
internal object EstoqueProdutoSeed {

    suspend fun garantirProdutoNaFilial(idProduto: Long, idFilial: Long): List<Long> {
        val estoques = idsEstoquesAtivos(idFilial).ifEmpty {
            listOf(criarEstoqueGeral(idFilial))
        }
        check(estoques.isNotEmpty()) { "A filial $idFilial não possui estoque ativo" }
        val ids = estoques.map { idEstoque -> upsertItemZerado(idEstoque, idProduto) }
        check(ids.size == estoques.size) { "Falha ao criar saldo zerado em todos os estoques da filial" }
        return ids
    }

    suspend fun garantirEstoqueNaFilial(idEstoque: Long, idFilial: Long): List<Long> {
        val produtos = idsProdutosDaFilial(idFilial)
        return produtos.map { idProduto -> upsertItemZerado(idEstoque, idProduto) }
    }

    suspend fun auditarInsert(tableName: String, recordId: Long, newValues: String) {
        gravarAuditLog(
            tableName = tableName,
            recordId = recordId.toString(),
            action = AuditAction.INSERT,
            newValues = newValues,
        )
    }

    private suspend fun idsEstoquesAtivos(idFilial: Long): List<Long> =
        EstoquesTable.selectAll()
            .where {
                (EstoquesTable.idFilial eq idFilial) and
                    (EstoquesTable.status neq Status.DELETADO.name.lowercase())
            }
            .toList()
            .map { it[EstoquesTable.id].value }

    private suspend fun idsProdutosDaFilial(idFilial: Long): List<Long> =
        ProdutoFilialTable
            .innerJoin(ProdutosTable)
            .selectAll()
            .where {
                (ProdutoFilialTable.idFilial eq idFilial) and
                    (ProdutoFilialTable.status neq Status.DELETADO.name.lowercase()) and
                    (ProdutosTable.status neq Status.DELETADO.name.lowercase())
            }
            .toList()
            .map { it[ProdutoFilialTable.idProduto].value }

    private suspend fun criarEstoqueGeral(idFilial: Long): Long {
        val inserted = EstoquesTable.insert {
            it[EstoquesTable.idFilial] = idFilial
            it[nome] = "Estoque Geral"
            it[status] = Status.ATIVO.name.lowercase()
        }
        val id = inserted[EstoquesTable.id].value
        auditarInsert("estoque", id, """{"idFilial":$idFilial,"nome":"Estoque Geral","status":"ativo"}""")
        return id
    }

    private suspend fun upsertItemZerado(idEstoque: Long, idProduto: Long): Long {
        val existente = EstoqueProdutosTable.selectAll()
            .where {
                (EstoqueProdutosTable.idEstoque eq idEstoque) and
                    (EstoqueProdutosTable.idProduto eq idProduto)
            }
            .toList()
            .singleOrNull()
        if (existente != null) {
            val id = existente[EstoqueProdutosTable.id].value
            if (existente[EstoqueProdutosTable.status] == Status.DELETADO.name.lowercase()) {
                EstoqueProdutosTable.update({ EstoqueProdutosTable.id eq id }) {
                    it[quantidade] = 0
                    it[quantidadeReservada] = 0
                    it[status] = Status.ATIVO.name.lowercase()
                }
                gravarAuditLog(
                    tableName = "estoque_produto",
                    recordId = id.toString(),
                    action = AuditAction.RESTORE,
                    newValues = """{"idEstoque":$idEstoque,"idProduto":$idProduto,"quantidade":0,"quantidadeReservada":0,"status":"ativo"}""",
                )
            }
            return id
        }
        val inserted = EstoqueProdutosTable.insert {
            it[EstoqueProdutosTable.idEstoque] = idEstoque
            it[EstoqueProdutosTable.idProduto] = idProduto
            it[quantidade] = 0
            it[quantidadeReservada] = 0
            it[status] = Status.ATIVO.name.lowercase()
        }
        val id = inserted[EstoqueProdutosTable.id].value
        check(id > 0) { "Falha ao inserir estoque_produto" }
        auditarInsert(
            "estoque_produto",
            id,
            """{"idEstoque":$idEstoque,"idProduto":$idProduto,"quantidade":0,"quantidadeReservada":0,"status":"ativo"}""",
        )
        return id
    }
}
