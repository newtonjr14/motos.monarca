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

    private val hoje = LocalDate.now(ZoneId.of("America/Asuncion")).toString()

    @Test
    fun `crud de cotacao do dia e bloqueia data futura`() = testApplication {
        configure()
        withAuth { token ->
            val listaExistente = Json.parseToJsonElement(client.get("/cotacoes") { auth(token) }.bodyAsText()).jsonArray
            for (item in listaExistente) {
                client.delete("/cotacoes/${item.jsonObject["id"]!!.jsonPrimitive.long}") { auth(token) }
            }
            val listaVazia = client.get("/cotacoes") { auth(token) }
            assertEquals(HttpStatusCode.OK, listaVazia.status)
            assertEquals(0, Json.parseToJsonElement(listaVazia.bodyAsText()).jsonArray.size)

            val hojeRes = client.get("/cotacoes/hoje") { auth(token) }
            assertEquals(HttpStatusCode.NotFound, hojeRes.status)
            assertEquals("COTACAO_DIA_AUSENTE", Json.parseToJsonElement(hojeRes.bodyAsText()).jsonObject["codigo"]!!.jsonPrimitive.content)

            val criada = client.post("/cotacoes") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody("""{"data":"$hoje","usdPyg":7300,"brlPyg":1400}""")
            }
            assertEquals(HttpStatusCode.Created, criada.status, criada.bodyAsText())
            val body = Json.parseToJsonElement(criada.bodyAsText()).jsonObject
            val id = body["id"]!!.jsonPrimitive.long
            assertEquals(hoje, body["data"]!!.jsonPrimitive.content)
            assertEquals(7300.0, body["usdPyg"]!!.jsonPrimitive.content.toDouble())
            assertTrue(auditouCotacao(id), "faltou audit_logs de cotacao $id")

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
            assertEquals(HttpStatusCode.OK, editada.status)
            assertEquals(7350.5, Json.parseToJsonElement(editada.bodyAsText()).jsonObject["usdPyg"]!!.jsonPrimitive.content.toDouble())

            val atual = client.get("/cotacoes/hoje") { auth(token) }
            assertEquals(HttpStatusCode.OK, atual.status)
            assertEquals(id, Json.parseToJsonElement(atual.bodyAsText()).jsonObject["id"]!!.jsonPrimitive.long)

            val futura = LocalDate.now(ZoneId.of("America/Asuncion")).plusDays(1)
            val futuro = client.post("/cotacoes") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody("""{"data":"$futura","usdPyg":7300,"brlPyg":1400}""")
            }
            assertEquals(HttpStatusCode.BadRequest, futuro.status)
            assertEquals("COTACAO_DATA_FUTURA", Json.parseToJsonElement(futuro.bodyAsText()).jsonObject["codigo"]!!.jsonPrimitive.content)

            val taxa = client.post("/cotacoes") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody("""{"data":"${LocalDate.parse(hoje).minusDays(1)}","usdPyg":0,"brlPyg":1400}""")
            }
            assertEquals(HttpStatusCode.BadRequest, taxa.status)
            assertEquals("COTACAO_TAXA_INVALIDA", Json.parseToJsonElement(taxa.bodyAsText()).jsonObject["codigo"]!!.jsonPrimitive.content)

            assertEquals(HttpStatusCode.NoContent, client.delete("/cotacoes/$id") { auth(token) }.status)
            assertEquals(HttpStatusCode.NotFound, client.get("/cotacoes/hoje") { auth(token) }.status)
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
            val criada = client.post("/cotacoes") {
                auth(gestor)
                contentType(ContentType.Application.Json)
                setBody("""{"data":"$hoje","usdPyg":7300,"brlPyg":1400}""")
            }
            assertEquals(HttpStatusCode.Created, criada.status, criada.bodyAsText())
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
