package com.monarca.cotacao.repository

import com.monarca.audit.domain.AuditAction
import com.monarca.audit.repository.gravarAuditLog
import com.monarca.common.enums.Status
import com.monarca.cotacao.domain.Cotacao
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.singleOrNull
import kotlinx.coroutines.flow.toList
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

class ExposedCotacaoRepository(
    private val database: R2dbcDatabase,
) : CotacaoRepository {

    override suspend fun listar(): List<Cotacao> = suspendTransaction(database) {
        CotacoesTable.selectAll()
            .where { CotacoesTable.status neq Status.DELETADO.name.lowercase() }
            .orderBy(CotacoesTable.data to SortOrder.DESC)
            .map { it.toCotacao() }
            .toList()
    }

    override suspend fun buscar(id: Long): Cotacao? = suspendTransaction(database) {
        CotacoesTable.selectAll()
            .where {
                (CotacoesTable.id eq id) and (CotacoesTable.status neq Status.DELETADO.name.lowercase())
            }
            .map { it.toCotacao() }
            .singleOrNull()
    }

    override suspend fun buscarPorData(data: String): Cotacao? = suspendTransaction(database) {
        CotacoesTable.selectAll()
            .where { CotacoesTable.data eq data }
            .map { it.toCotacao() }
            .singleOrNull()
    }

    override suspend fun inserir(cotacao: Cotacao): Long = suspendTransaction(database) {
        val inserted = CotacoesTable.insert {
            it[data] = cotacao.data
            it[usdPyg] = cotacao.usdPyg
            it[brlPyg] = cotacao.brlPyg
            it[status] = cotacao.status.name.lowercase()
        }
        val id = inserted[CotacoesTable.id].value
        gravarAuditLog("cotacao", id.toString(), AuditAction.INSERT, newValues = jsonCotacao(cotacao.copy(id = id)))
        id
    }

    override suspend fun atualizar(id: Long, cotacao: Cotacao): Boolean = suspendTransaction(database) {
        val ok = CotacoesTable.update({ CotacoesTable.id eq id }) {
            it[data] = cotacao.data
            it[usdPyg] = cotacao.usdPyg
            it[brlPyg] = cotacao.brlPyg
            it[status] = cotacao.status.name.lowercase()
        } > 0
        if (ok) {
            gravarAuditLog("cotacao", id.toString(), AuditAction.UPDATE, newValues = jsonCotacao(cotacao.copy(id = id)))
        }
        ok
    }

    override suspend fun excluir(id: Long): Boolean = suspendTransaction(database) {
        val ok = CotacoesTable.update({
            (CotacoesTable.id eq id) and (CotacoesTable.status neq Status.DELETADO.name.lowercase())
        }) {
            it[status] = Status.DELETADO.name.lowercase()
        } > 0
        if (ok) {
            gravarAuditLog("cotacao", id.toString(), AuditAction.SOFT_DELETE)
        }
        ok
    }

    private fun jsonCotacao(cotacao: Cotacao) =
        """{"id":${cotacao.id},"data":"${cotacao.data}","usdPyg":${cotacao.usdPyg},"brlPyg":${cotacao.brlPyg},"status":"${cotacao.status.name.lowercase()}"}"""

    private fun ResultRow.toCotacao() = Cotacao(
        id = this[CotacoesTable.id].value,
        data = this[CotacoesTable.data],
        usdPyg = this[CotacoesTable.usdPyg],
        brlPyg = this[CotacoesTable.brlPyg],
        status = Status.valueOf(this[CotacoesTable.status].uppercase()),
    )
}
