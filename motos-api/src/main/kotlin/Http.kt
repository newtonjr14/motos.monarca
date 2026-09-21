package com.monarca

import io.ktor.http.HttpHeaders
import io.ktor.http.HttpMethod
import io.ktor.server.application.Application
import io.ktor.server.application.install
import io.ktor.server.application.log
import io.ktor.server.plugins.cors.routing.CORS

fun Application.configureHttp() {
    val hosts = environment.config.propertyOrNull("cors.hosts")
        ?.getList()
        ?.map { it.trim() }
        ?.filter { it.isNotEmpty() }
        .orEmpty()
    val appLog = log

    install(CORS) {
        allowMethod(HttpMethod.Options)
        allowMethod(HttpMethod.Post)
        allowMethod(HttpMethod.Put)
        allowMethod(HttpMethod.Delete)
        allowMethod(HttpMethod.Patch)
        allowHeader(HttpHeaders.Authorization)
        allowHeader(HttpHeaders.ContentType)
        allowCredentials = true
        if (hosts.isEmpty() || hosts.any { it == "*" }) {
            appLog.warn("CORS: anyHost (só use em testes/dev). Em produção defina cors.hosts.")
            anyHost()
        } else {
            for (host in hosts) {
                val cleaned = host.removePrefix("https://").removePrefix("http://")
                val schemes = when {
                    host.startsWith("https://") -> listOf("https")
                    host.startsWith("http://") -> listOf("http")
                    else -> listOf("http", "https")
                }
                allowHost(cleaned, schemes = schemes)
            }
            appLog.info("CORS hosts: $hosts")
        }
    }
}
