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
import java.time.LocalDate
import java.time.ZoneId
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.long

class CotacaoTest {

    private val zona = ZoneId.of("America/Asuncion")
    private val hoje = LocalDate.now(zona).toString()

    @Test
    fun `edita so a cotacao do dia e nao exclui`() = testApplication {
        configure()
        withAuth { token ->
            val listaExistente = Json.parseToJsonElement(client.get("/cotacoes") { auth(token) }.bodyAsText()).jsonArray
            val hojeExistente = listaExistente.firstOrNull { it.jsonObject["data"]!!.jsonPrimitive.content == hoje }
            val id = if (hojeExistente != null) {
                hojeExistente.jsonObject["id"]!!.jsonPrimitive.long
            } else {
                val criada = client.post("/cotacoes") {
                    auth(token)
                    contentType(ContentType.Application.Json)
                    setBody("""{"data":"$hoje","usdPyg":7300,"brlPyg":1400}""")
                }
                assertEquals(HttpStatusCode.Created, criada.status, criada.bodyAsText())
                Json.parseToJsonElement(criada.bodyAsText()).jsonObject["id"]!!.jsonPrimitive.long
            }

            val dup = client.post("/cotacoes") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody("""{"data":"$hoje","usdPyg":7400,"brlPyg":1410}""")
            }
            assertEquals(HttpStatusCode.BadRequest, dup.status)
            assertEquals("COTACAO_DIA_DUPLICADA", Json.parseToJsonElement(dup.bodyAsText()).jsonObject["codigo"]!!.jsonPrimitive.content)

            val editada = client.put("/cotacoes/$id") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody("""{"data":"$hoje","usdPyg":7350.5,"brlPyg":1410}""")
            }
            assertEquals(HttpStatusCode.OK, editada.status, editada.bodyAsText())
            assertEquals(7350.5, Json.parseToJsonElement(editada.bodyAsText()).jsonObject["usdPyg"]!!.jsonPrimitive.content.toDouble())
            assertTrue(auditouCotacao(id), "faltou audit_logs de cotacao $id")

            val atual = client.get("/cotacoes/hoje") { auth(token) }
            assertEquals(HttpStatusCode.OK, atual.status)
            assertEquals(id, Json.parseToJsonElement(atual.bodyAsText()).jsonObject["id"]!!.jsonPrimitive.long)

            val futura = LocalDate.now(zona).plusDays(1)
            val futuro = client.post("/cotacoes") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody("""{"data":"$futura","usdPyg":7300,"brlPyg":1400}""")
            }
            assertEquals(HttpStatusCode.BadRequest, futuro.status)
            assertEquals("COTACAO_DATA_FUTURA", Json.parseToJsonElement(futuro.bodyAsText()).jsonObject["codigo"]!!.jsonPrimitive.content)

            val ontem = LocalDate.now(zona).minusDays(1).toString()
            val taxa = client.post("/cotacoes") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody("""{"data":"$ontem","usdPyg":0,"brlPyg":1400}""")
            }
            assertEquals(HttpStatusCode.BadRequest, taxa.status)
            assertEquals("COTACAO_TAXA_INVALIDA", Json.parseToJsonElement(taxa.bodyAsText()).jsonObject["codigo"]!!.jsonPrimitive.content)

            val listaAtual = Json.parseToJsonElement(client.get("/cotacoes") { auth(token) }.bodyAsText()).jsonArray
            val ontemExistente = listaAtual.firstOrNull { it.jsonObject["data"]!!.jsonPrimitive.content == ontem }
            val idOntem = if (ontemExistente != null) {
                ontemExistente.jsonObject["id"]!!.jsonPrimitive.long
            } else {
                val passada = client.post("/cotacoes") {
                    auth(token)
                    contentType(ContentType.Application.Json)
                    setBody("""{"data":"$ontem","usdPyg":7200,"brlPyg":1390}""")
                }
                assertEquals(HttpStatusCode.Created, passada.status, passada.bodyAsText())
                Json.parseToJsonElement(passada.bodyAsText()).jsonObject["id"]!!.jsonPrimitive.long
            }
            val editaPassada = client.put("/cotacoes/$idOntem") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody("""{"data":"$ontem","usdPyg":7210,"brlPyg":1395}""")
            }
            assertEquals(HttpStatusCode.BadRequest, editaPassada.status)
            assertEquals("COTACAO_SO_HOJE", Json.parseToJsonElement(editaPassada.bodyAsText()).jsonObject["codigo"]!!.jsonPrimitive.content)

            val exclui = client.delete("/cotacoes/$id") { auth(token) }
            assertEquals(HttpStatusCode.BadRequest, exclui.status)
            assertEquals("COTACAO_NAO_EXCLUI", Json.parseToJsonElement(exclui.bodyAsText()).jsonObject["codigo"]!!.jsonPrimitive.content)
            assertEquals(HttpStatusCode.OK, client.get("/cotacoes/hoje") { auth(token) }.status)
        }
    }

    @Test
    fun `vendedor e operador consultam e nao gerenciam cotacao`() = testApplication {
        configure()
        withAuth { admin ->
            val vendedor = criarELogar(admin, "vendedor")
            val operador = criarELogar(admin, "operador")
            val gestor = criarELogar(admin, "gestor")
            assertEquals(HttpStatusCode.OK, client.get("/cotacoes") { auth(vendedor) }.status)
            assertEquals(HttpStatusCode.OK, client.get("/cotacoes") { auth(operador) }.status)
            assertEquals(
                HttpStatusCode.Forbidden,
                client.post("/cotacoes") {
                    auth(vendedor)
                    contentType(ContentType.Application.Json)
                    setBody("""{"data":"$hoje","usdPyg":7300,"brlPyg":1400}""")
                }.status,
            )
            assertEquals(
                HttpStatusCode.Forbidden,
                client.post("/cotacoes") {
                    auth(operador)
                    contentType(ContentType.Application.Json)
                    setBody("""{"data":"$hoje","usdPyg":7300,"brlPyg":1400}""")
                }.status,
            )
            val hojeRes = client.get("/cotacoes/hoje") { auth(gestor) }
            if (hojeRes.status == HttpStatusCode.NotFound) {
                val criada = client.post("/cotacoes") {
                    auth(gestor)
                    contentType(ContentType.Application.Json)
                    setBody("""{"data":"$hoje","usdPyg":7300,"brlPyg":1400}""")
                }
                assertEquals(HttpStatusCode.Created, criada.status, criada.bodyAsText())
            } else {
                val id = Json.parseToJsonElement(hojeRes.bodyAsText()).jsonObject["id"]!!.jsonPrimitive.long
                val editada = client.put("/cotacoes/$id") {
                    auth(gestor)
                    contentType(ContentType.Application.Json)
                    setBody("""{"data":"$hoje","usdPyg":7300,"brlPyg":1400}""")
                }
                assertEquals(HttpStatusCode.OK, editada.status, editada.bodyAsText())
            }
        }
    }
}

private fun auditouCotacao(id: Long): Boolean {
    val url =
        "jdbc:h2:mem:localidade_test;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE"
    java.sql.DriverManager.getConnection(url, "root", "").use { conn ->
        conn.prepareStatement(
            "SELECT 1 FROM audit_logs WHERE table_name = 'cotacao' AND record_id = ?",
        ).use { ps ->
            ps.setString(1, id.toString())
            ps.executeQuery().use { rs -> return rs.next() }
        }
    }
}
