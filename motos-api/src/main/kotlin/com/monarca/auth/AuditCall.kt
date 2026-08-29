package com.monarca.auth

import com.monarca.audit.AuditContext
import com.monarca.auth.domain.UsuarioAutenticado
import io.ktor.server.application.ApplicationCall
import io.ktor.server.auth.principal
import kotlinx.coroutines.withContext

suspend fun <T> ApplicationCall.withAudit(block: suspend () -> T): T {
    val userId = principal<UsuarioAutenticado>()?.id
    return withContext(AuditContext.withUser(userId)) { block() }
}
