package com.monarca.audit.service

import com.monarca.audit.AuditContext
import com.monarca.audit.domain.AuditAction
import com.monarca.audit.repository.AuditRepository

class AuditService(
    private val repository: AuditRepository,
) {
    suspend fun registrarInsert(tableName: String, recordId: String, newValues: String?) {
        registrar(tableName, recordId, AuditAction.INSERT, null, newValues)
    }

    suspend fun registrarUpdate(tableName: String, recordId: String, oldValues: String?, newValues: String?) {
        registrar(tableName, recordId, AuditAction.UPDATE, oldValues, newValues)
    }

    suspend fun registrarSoftDelete(tableName: String, recordId: String, oldValues: String?) {
        registrar(tableName, recordId, AuditAction.SOFT_DELETE, oldValues, null)
    }

    suspend fun registrarRestore(tableName: String, recordId: String, newValues: String?) {
        registrar(tableName, recordId, AuditAction.RESTORE, null, newValues)
    }

    private suspend fun registrar(
        tableName: String,
        recordId: String,
        action: AuditAction,
        oldValues: String?,
        newValues: String?,
    ) {
        repository.registrar(
            tableName = tableName,
            recordId = recordId,
            action = action,
            oldValues = oldValues,
            newValues = newValues,
            userId = AuditContext.userId(),
        )
    }
}
