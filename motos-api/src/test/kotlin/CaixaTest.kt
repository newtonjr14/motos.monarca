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
import kotlin.test.assertNotNull
import kotlin.test.assertTrue
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.double
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.long

class CaixaTest {

    @Test
    fun `finalizador e caixa tem crud e sessao com conferencia`() = testApplication {
        configure()
        withAuth { token ->
            val fins = Json.parseToJsonElement(client.get("/finalizadores") { auth(token) }.bodyAsText()).jsonArray
            assertTrue(fins.size >= 3)
            val idDinheiro = fins.first { it.jsonObject["nome"]!!.jsonPrimitive.content == "Dinheiro" }
                .jsonObject["id"]!!.jsonPrimitive.long

            val criadoFin = client.post("/finalizadores") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody("""{"nome":"pix teste","tipo":"deposito"}""")
            }
            assertEquals(HttpStatusCode.Created, criadoFin.status, criadoFin.bodyAsText())
            val idFin = Json.parseToJsonElement(criadoFin.bodyAsText()).jsonObject["id"]!!.jsonPrimitive.long
            assertEquals("Pix Teste", Json.parseToJsonElement(criadoFin.bodyAsText()).jsonObject["nome"]!!.jsonPrimitive.content)

            val editado = client.put("/finalizadores/$idFin") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody("""{"nome":"Pix Teste","tipo":"deposito","status":"inativo"}""")
            }
            assertEquals(HttpStatusCode.OK, editado.status)
            assertEquals(HttpStatusCode.NoContent, client.delete("/finalizadores/$idFin") { auth(token) }.status)

            val caixas = Json.parseToJsonElement(client.get("/caixas") { auth(token) }.bodyAsText()).jsonArray
            assertTrue(caixas.isNotEmpty())
            val idFilial = caixas.first().jsonObject["idFilial"]!!.jsonPrimitive.long

            val n = System.nanoTime()
            val caixaA = client.post("/caixas") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody("""{"idFilial":$idFilial,"nome":"Caixa A $n"}""")
            }
            assertEquals(HttpStatusCode.Created, caixaA.status, caixaA.bodyAsText())
            val idCaixa = Json.parseToJsonElement(caixaA.bodyAsText()).jsonObject["id"]!!.jsonPrimitive.long

            val caixa2 = client.post("/caixas") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody("""{"idFilial":$idFilial,"nome":"Caixa 2 $n"}""")
            }
            assertEquals(HttpStatusCode.Created, caixa2.status, caixa2.bodyAsText())
            val idCaixa2 = Json.parseToJsonElement(caixa2.bodyAsText()).jsonObject["id"]!!.jsonPrimitive.long

            val aberta = client.post("/caixa-sessoes") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody("""{"idCaixa":$idCaixa,"conferencia":[{"idFinalizador":$idDinheiro,"valor":10000}]}""")
            }
            assertEquals(HttpStatusCode.Created, aberta.status, aberta.bodyAsText())
            val idSessao = Json.parseToJsonElement(aberta.bodyAsText()).jsonObject["id"]!!.jsonPrimitive.long
            val saldos = Json.parseToJsonElement(aberta.bodyAsText()).jsonObject["saldos"]!!.jsonArray
            assertTrue(saldos.any { it.jsonObject["valor"]!!.jsonPrimitive.double == 10000.0 })
            assertTrue(saldos.any { it.jsonObject["moeda"]!!.jsonPrimitive.content == "pyg" })

            val dup = client.post("/caixa-sessoes") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody("""{"idCaixa":$idCaixa,"conferencia":[]}""")
            }
            assertEquals(HttpStatusCode.BadRequest, dup.status)
            assertEquals("CAIXA_SESSAO_ABERTA", Json.parseToJsonElement(dup.bodyAsText()).jsonObject["codigo"]!!.jsonPrimitive.content)

            val dest = client.post("/caixa-sessoes") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody("""{"idCaixa":$idCaixa2,"conferencia":[]}""")
            }
            assertEquals(HttpStatusCode.Created, dest.status, dest.bodyAsText())
            val idDestino = Json.parseToJsonElement(dest.bodyAsText()).jsonObject["id"]!!.jsonPrimitive.long
            assertNotNull(idDestino)

            val transf = client.post("/caixa-sessoes/$idSessao/transferencias") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody("""{"idCaixaDestino":$idCaixa2,"conferencia":[{"idFinalizador":$idDinheiro,"valor":2500}]}""")
            }
            assertEquals(HttpStatusCode.NoContent, transf.status, transf.bodyAsText())

            val origem = Json.parseToJsonElement(client.get("/caixa-sessoes/$idSessao") { auth(token) }.bodyAsText()).jsonObject
            val saldoOrigem = origem["saldos"]!!.jsonArray.first { it.jsonObject["idFinalizador"]!!.jsonPrimitive.long == idDinheiro }
            assertEquals(7500.0, saldoOrigem.jsonObject["valor"]!!.jsonPrimitive.double)

            val fechada = client.post("/caixa-sessoes/$idSessao/fechar") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody("""{"conferencia":[{"idFinalizador":$idDinheiro,"valor":7400}],"observacao":"faltou 100"}""")
            }
            assertEquals(HttpStatusCode.OK, fechada.status, fechada.bodyAsText())
            assertEquals("fechado", Json.parseToJsonElement(fechada.bodyAsText()).jsonObject["status"]!!.jsonPrimitive.content)

            val movs = Json.parseToJsonElement(
                client.get("/caixa-sessoes/$idSessao/movimentacoes") { auth(token) }.bodyAsText(),
            ).jsonArray
            assertTrue(movs.any { it.jsonObject["tipo"]!!.jsonPrimitive.content == "abertura" })
            assertTrue(movs.any { it.jsonObject["tipo"]!!.jsonPrimitive.content == "transferencia_saida" })
            assertTrue(movs.any { it.jsonObject["tipo"]!!.jsonPrimitive.content == "fechamento" })
        }
    }
}
