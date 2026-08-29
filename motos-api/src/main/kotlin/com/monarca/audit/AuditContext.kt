package com.monarca.audit

import com.monarca.audit.domain.AuditAction
import kotlinx.coroutines.currentCoroutineContext
import kotlin.coroutines.CoroutineContext

object AuditContext {
    private val key = object : CoroutineContext.Key<AuditUserElement> {}

    suspend fun userId(): Long? =
        currentCoroutineContext()[key]?.userId

    fun withUser(userId: Long?): CoroutineContext =
        AuditUserElement(userId)

    private data class AuditUserElement(val userId: Long?) : CoroutineContext.Element {
        override val key: CoroutineContext.Key<*> = AuditContext.key
    }
}

data class AuditEntry(
    val tableName: String,
    val recordId: String,
    val action: AuditAction,
    val oldValues: String? = null,
    val newValues: String? = null,
    val userId: Long? = null,
)
