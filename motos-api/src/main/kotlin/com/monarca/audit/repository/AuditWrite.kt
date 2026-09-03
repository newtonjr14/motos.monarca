package com.monarca.audit.repository

import com.monarca.audit.AuditContext
import com.monarca.audit.domain.AuditAction
import java.util.UUID
import org.jetbrains.exposed.v1.r2dbc.insert

/**
 * Grava `audit_logs` na transação Exposed já aberta.
 * Falha aqui aborta o commit do insert de negócio.
 */
internal suspend fun gravarAuditLog(
    tableName: String,
    recordId: String,
    action: AuditAction,
    oldValues: String? = null,
    newValues: String? = null,
    userId: Long? = null,
) {
    val autor = userId ?: AuditContext.userId()
    AuditLogsTable.insert {
        it[id] = UUID.randomUUID().toString()
        it[auditTableName] = tableName
        it[AuditLogsTable.recordId] = recordId
        it[AuditLogsTable.action] = action.name
        it[AuditLogsTable.oldValues] = oldValues
        it[AuditLogsTable.newValues] = newValues
        it[AuditLogsTable.userId] = autor
        it[createdAt] = System.currentTimeMillis()
    }
}
