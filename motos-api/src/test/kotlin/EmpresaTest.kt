package com.monarca

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
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.long

class EmpresaTest {

    @Test
    fun `seed empresa e filial principal vem da migration`() = testApplication {
        configure()
        withAuth { token ->
            val empresas = Json.parseToJsonElement(client.get("/empresas") { auth(token) }.bodyAsText()).jsonArray
            assertTrue(empresas.isNotEmpty())
            val empresa = empresas.first().jsonObject
            assertEquals("80009735-1", empresa["ruc"]!!.jsonPrimitive.content)
            assertEquals("ativo", empresa["status"]!!.jsonPrimitive.content)

            val principal = Json.parseToJsonElement(
                client.get("/filiais/principal") { auth(token) }.bodyAsText(),
            ).jsonObject
            assertEquals(true, principal["principal"]!!.jsonPrimitive.content.toBoolean())
            assertEquals("py_iva", principal["perfilFiscal"]!!.jsonPrimitive.content)
            assertTrue(principal["moedaOperacao"]!!.jsonPrimitive.content in setOf("usd", "pyg", "brl"))
            assertEquals(empresa["id"]!!.jsonPrimitive.long, principal["idEmpresa"]!!.jsonPrimitive.long)
        }
    }

    @Test
    fun `filial tem crud e respeita principal unica`() = testApplication {
        configure()
        withAuth { token ->
            val empresaId = Json.parseToJsonElement(client.get("/empresas") { auth(token) }.bodyAsText())
                .jsonArray.first().jsonObject["id"]!!.jsonPrimitive.long

            val n = System.nanoTime()
            val created = client.post("/filiais") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody("""{"idEmpresa":$empresaId,"nome":"Sucursal $n","principal":false}""")
            }
            assertEquals(HttpStatusCode.Created, created.status)
            val filial = Json.parseToJsonElement(created.bodyAsText()).jsonObject
            val id = filial["id"]!!.jsonPrimitive.long
            assertEquals("Sucursal $n", filial["nome"]!!.jsonPrimitive.content)
            assertEquals("py_iva", filial["perfilFiscal"]!!.jsonPrimitive.content)

            val updated = client.put("/filiais/$id") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody("""{"idEmpresa":$empresaId,"nome":"Sucursal Editada $n","principal":true}""")
            }
            assertEquals(HttpStatusCode.OK, updated.status)
            val editada = Json.parseToJsonElement(updated.bodyAsText()).jsonObject
            assertEquals("Sucursal Editada $n", editada["nome"]!!.jsonPrimitive.content)
            assertEquals(true, editada["principal"]!!.jsonPrimitive.content.toBoolean())

            val principal = Json.parseToJsonElement(
                client.get("/filiais/principal") { auth(token) }.bodyAsText(),
            ).jsonObject
            assertEquals(id, principal["id"]!!.jsonPrimitive.long)

            val moeda = client.put("/filiais/$id") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody("""{"idEmpresa":$empresaId,"nome":"Sucursal Editada $n","moedaOperacao":"pyg","principal":true}""")
            }
            assertEquals(HttpStatusCode.OK, moeda.status)
            assertEquals("pyg", Json.parseToJsonElement(moeda.bodyAsText()).jsonObject["moedaOperacao"]!!.jsonPrimitive.content)
        }
    }
}
