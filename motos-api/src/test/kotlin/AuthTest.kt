package com.monarca

import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.HttpStatusCode
import io.ktor.http.contentType
import io.ktor.server.testing.testApplication
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

class AuthTest {

    @Test
    fun `login system retorna tokens`() = testApplication {
        configure()

        val res = client.post("/auth/login") {
            contentType(ContentType.Application.Json)
            setBody("""{"login":"system","senha":"System@250623"}""")
        }
        assertEquals(HttpStatusCode.OK, res.status)
        val body = Json.parseToJsonElement(res.bodyAsText()).jsonObject
        assertTrue(body["accessToken"]!!.jsonPrimitive.content.isNotBlank())
        assertTrue(body["refreshToken"]!!.jsonPrimitive.content.isNotBlank())
        assertEquals("Bearer", body["tokenType"]!!.jsonPrimitive.content)
    }

    @Test
    fun `login invalido retorna 400`() = testApplication {
        configure()

        val res = client.post("/auth/login") {
            contentType(ContentType.Application.Json)
            setBody("""{"login":"system","senha":"errada"}""")
        }
        assertEquals(HttpStatusCode.BadRequest, res.status)
    }
}
