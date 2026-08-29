package com.monarca.audit.repository

import com.monarca.audit.domain.AuditAction

interface AuditRepository {
    suspend fun registrar(
        tableName: String,
        recordId: String,
        action: AuditAction,
        oldValues: String?,
        newValues: String?,
        userId: Long?,
    )
}
