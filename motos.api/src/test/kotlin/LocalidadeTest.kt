package com.monarca

import io.ktor.client.request.delete
import io.ktor.client.request.get
import io.ktor.client.request.post
import io.ktor.client.request.put
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
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.long

class LocalidadeTest {

    @Test
    fun `paises e divisoes vem da semente e cidade tem crud`() = testApplication {
        configure()

        val paisesResponse = client.get("/paises")
        assertEquals(HttpStatusCode.OK, paisesResponse.status)
        val paises = Json.parseToJsonElement(paisesResponse.bodyAsText()).jsonArray
        assertTrue(paises.size >= 2)

        val brasil = paises.first { it.jsonObject["sigla"]!!.jsonPrimitive.content == "BR" }.jsonObject
        val paraguai = paises.first { it.jsonObject["sigla"]!!.jsonPrimitive.content == "PY" }.jsonObject
        assertEquals(true, brasil["usaSiglaDivisao"]!!.jsonPrimitive.content.toBoolean())
        assertEquals("ativo", brasil["status"]!!.jsonPrimitive.content)
        assertEquals(false, paraguai["usaSiglaDivisao"]!!.jsonPrimitive.content.toBoolean())

        val brasilId = brasil["id"]!!.jsonPrimitive.long
        val paraguaiId = paraguai["id"]!!.jsonPrimitive.long

        val ufs = Json.parseToJsonElement(client.get("/paises/$brasilId/divisoes").bodyAsText()).jsonArray
        val departamentos = Json.parseToJsonElement(client.get("/paises/$paraguaiId/divisoes").bodyAsText()).jsonArray
        assertTrue(ufs.any { it.jsonObject["sigla"]?.jsonPrimitive?.content == "MS" })
        val amambay = departamentos.first { it.jsonObject["nome"]!!.jsonPrimitive.content == "Amambay" }.jsonObject
        assertEquals(JsonNull, amambay["sigla"])

        val msId = ufs.first { it.jsonObject["sigla"]?.jsonPrimitive?.content == "MS" }
            .jsonObject["id"]!!.jsonPrimitive.long

        val nome = "Ponta Porã ${System.nanoTime()}"
        val created = client.post("/cidades") {
            contentType(ContentType.Application.Json)
            setBody("""{"nome":"$nome","idDivisao":$msId}""")
        }
        assertEquals(HttpStatusCode.Created, created.status)
        val cidade = Json.parseToJsonElement(created.bodyAsText()).jsonObject
        assertEquals(nome, cidade["nome"]!!.jsonPrimitive.content)
        assertEquals("MS", cidade["divisaoSigla"]!!.jsonPrimitive.content)
        assertEquals("BR", cidade["paisSigla"]!!.jsonPrimitive.content)
        assertEquals("ativo", cidade["status"]!!.jsonPrimitive.content)
    }

    @Test
    fun `pais tem crud com soft delete`() = testApplication {
        configure()

        val n = System.nanoTime()
        val sigla = "${'A' + ((n / 26) % 26).toInt()}${'A' + (n % 26).toInt()}"
        val created = client.post("/paises") {
            contentType(ContentType.Application.Json)
            setBody("""{"nome":"Teste $sigla","sigla":"$sigla","usaSiglaDivisao":false}""")
        }
        assertEquals(HttpStatusCode.Created, created.status)
        val pais = Json.parseToJsonElement(created.bodyAsText()).jsonObject
        val id = pais["id"]!!.jsonPrimitive.long
        assertEquals(sigla, pais["sigla"]!!.jsonPrimitive.content)
        assertEquals("ativo", pais["status"]!!.jsonPrimitive.content)

        val updated = client.put("/paises/$id") {
            contentType(ContentType.Application.Json)
            setBody("""{"nome":"Teste atualizado","sigla":"$sigla","usaSiglaDivisao":true,"status":"inativo"}""")
        }
        assertEquals(HttpStatusCode.OK, updated.status)
        val atualizado = Json.parseToJsonElement(updated.bodyAsText()).jsonObject
        assertEquals("Teste atualizado", atualizado["nome"]!!.jsonPrimitive.content)
        assertEquals("inativo", atualizado["status"]!!.jsonPrimitive.content)
        assertEquals(HttpStatusCode.OK, client.get("/paises/$id").status)

        val deleted = client.delete("/paises/$id")
        assertEquals(HttpStatusCode.NoContent, deleted.status)
        assertEquals(HttpStatusCode.NotFound, client.get("/paises/$id").status)

        val listados = Json.parseToJsonElement(client.get("/paises").bodyAsText()).jsonArray
        assertTrue(listados.none { it.jsonObject["id"]!!.jsonPrimitive.long == id })
    }
}
