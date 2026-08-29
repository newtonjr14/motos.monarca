package com.monarca

import io.ktor.client.request.HttpRequestBuilder
import io.ktor.client.request.header
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.HttpHeaders
import io.ktor.http.contentType
import io.ktor.server.testing.ApplicationTestBuilder
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

suspend fun ApplicationTestBuilder.loginComoSystem(): String {
    val res = client.post("/auth/login") {
        contentType(ContentType.Application.Json)
        setBody("""{"login":"system","senha":"System@250623"}""")
    }
    val body = Json.parseToJsonElement(res.bodyAsText()).jsonObject
    return body["accessToken"]!!.jsonPrimitive.content
}

fun HttpRequestBuilder.auth(token: String) {
    header(HttpHeaders.Authorization, "Bearer $token")
}

/** Gera CPF válido (11 dígitos com DV) a partir de 9 dígitos base. */
fun cpfComDv(base9: String): String {
    require(base9.length == 9 && base9.all { it.isDigit() })
    fun dv(parcial: String, pesoInicial: Int): Int {
        var soma = 0
        for (i in parcial.indices) {
            soma += (parcial[i] - '0') * (pesoInicial - i)
        }
        val resto = soma % 11
        return if (resto < 2) 0 else 11 - resto
    }
    val d1 = dv(base9, 10)
    val d2 = dv(base9 + d1, 11)
    return base9 + d1.toString() + d2.toString()
}

fun cpfValidoAleatorio(): String {
    val base = "%09d".format(System.nanoTime() % 1_000_000_000L)
    return cpfComDv(base)
}

suspend fun ApplicationTestBuilder.withAuth(block: suspend ApplicationTestBuilder.(token: String) -> Unit) {
    block(loginComoSystem())
}
