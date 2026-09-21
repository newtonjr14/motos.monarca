package com.monarca

import io.ktor.http.HttpStatusCode
import io.ktor.server.application.Application
import io.ktor.server.response.respond
import io.ktor.server.routing.get
import io.ktor.server.routing.routing
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.v1.r2dbc.R2dbcDatabase
import org.jetbrains.exposed.v1.r2dbc.transactions.suspendTransaction
import org.koin.ktor.ext.get as koinGet

@Serializable
data class HealthResponse(
    val status: String,
    val database: String = "unknown",
)

fun Application.configureHealth() {
    routing {
        get("/health") {
            val dbStatus = runCatching {
                val database = call.application.koinGet<R2dbcDatabase>()
                suspendTransaction(database) { }
                "ok"
            }.getOrElse { "error" }

            val ok = dbStatus == "ok"
            call.respond(
                if (ok) HttpStatusCode.OK else HttpStatusCode.ServiceUnavailable,
                HealthResponse(
                    status = if (ok) "ok" else "degraded",
                    database = dbStatus,
                ),
            )
        }
    }
}
