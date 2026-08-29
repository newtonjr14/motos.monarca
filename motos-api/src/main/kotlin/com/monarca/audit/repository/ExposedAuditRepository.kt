package com.monarca.audit.repository

import com.monarca.audit.domain.AuditAction
import java.util.UUID
import org.jetbrains.exposed.v1.r2dbc.R2dbcDatabase
import org.jetbrains.exposed.v1.r2dbc.insert
import org.jetbrains.exposed.v1.r2dbc.transactions.suspendTransaction

class ExposedAuditRepository(
    private val database: R2dbcDatabase,
) : AuditRepository {

    override suspend fun registrar(
        tableName: String,
        recordId: String,
        action: AuditAction,
        oldValues: String?,
        newValues: String?,
        userId: Long?,
    ) = suspendTransaction(database) {
        AuditLogsTable.insert {
            it[id] = UUID.randomUUID().toString()
            it[auditTableName] = tableName
            it[AuditLogsTable.recordId] = recordId
            it[AuditLogsTable.action] = action.name
            it[AuditLogsTable.oldValues] = oldValues
            it[AuditLogsTable.newValues] = newValues
            it[AuditLogsTable.userId] = userId
            it[AuditLogsTable.createdAt] = System.currentTimeMillis()
        }
        Unit
    }
}
