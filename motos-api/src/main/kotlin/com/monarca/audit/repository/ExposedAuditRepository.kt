package com.monarca.audit.repository

import com.monarca.audit.domain.AuditAction
import org.jetbrains.exposed.v1.r2dbc.R2dbcDatabase
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
        gravarAuditLog(tableName, recordId, action, oldValues, newValues, userId)
    }
}
