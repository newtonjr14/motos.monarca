package com.monarca

import io.ktor.client.request.get
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
import kotlinx.serialization.json.boolean
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import java.time.LocalDate
import java.time.ZoneId

class FacturaTest {

    private val hoje = LocalDate.now(ZoneId.of("America/Asuncion")).toString()

    @Test
    fun `lista facturas e exige sudtax ligada para emitir`() = testApplication {
        configure()
        withAuth { token ->
            val hojeRes = client.get("/cotacoes/hoje") { auth(token) }
            if (hojeRes.status != HttpStatusCode.OK) {
                val cotacao = client.post("/cotacoes") {
                    auth(token)
                    contentType(ContentType.Application.Json)
                    setBody("""{"data":"$hoje","usdPyg":7300,"brlPyg":1400}""")
                }
                assertEquals(HttpStatusCode.Created, cotacao.status, cotacao.bodyAsText())
            }

            val lista = client.get("/facturas") { auth(token) }
            assertEquals(HttpStatusCode.OK, lista.status, lista.bodyAsText())
            assertTrue(Json.parseToJsonElement(lista.bodyAsText()).jsonArray.isEmpty())

            val elegiveis = client.get("/facturas/vendas-elegiveis") { auth(token) }
            assertEquals(HttpStatusCode.OK, elegiveis.status, elegiveis.bodyAsText())

            val emitir = client.post("/facturas") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody("""{"idVenda":1,"enviar":false}""")
            }
            assertEquals(HttpStatusCode.BadRequest, emitir.status, emitir.bodyAsText())
            assertEquals(
                "SUDTAX_DESLIGADA",
                Json.parseToJsonElement(emitir.bodyAsText()).jsonObject["codigo"]!!.jsonPrimitive.content,
            )
        }
    }

    @Test
    fun `preview documento eletronico responde estrutura do contrato`() = testApplication {
        configure()
        withAuth { token ->
            val missing = client.get("/vendas/999999/documento-eletronico") { auth(token) }
            assertEquals(HttpStatusCode.NotFound, missing.status)

            val lista = client.get("/vendas") { auth(token) }
            assertEquals(HttpStatusCode.OK, lista.status)
            val vendas = Json.parseToJsonElement(lista.bodyAsText()).jsonArray
            if (vendas.isEmpty()) return@withAuth

            val id = vendas.first().jsonObject["id"]!!.jsonPrimitive.content
            val preview = client.get("/vendas/$id/documento-eletronico") { auth(token) }
            assertEquals(HttpStatusCode.OK, preview.status, preview.bodyAsText())
            val body = Json.parseToJsonElement(preview.bodyAsText()).jsonObject
            assertTrue(body["pronto"]!!.jsonPrimitive.boolean || body["avisos"]!!.jsonArray.isNotEmpty())
            if (body["pronto"]!!.jsonPrimitive.boolean) {
                val doc = body["documento"]!!.jsonObject
                assertEquals("factura", doc["tipo"]!!.jsonPrimitive.content)
                assertTrue(doc["referencia"]!!.jsonPrimitive.content.startsWith("venda-"))
                assertTrue(doc["dados"]!!.jsonObject["itens"]!!.jsonArray.isNotEmpty())
            }
        }
    }
}
