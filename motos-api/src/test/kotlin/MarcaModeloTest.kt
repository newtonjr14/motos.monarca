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
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.long

class MarcaModeloTest {

    @Test
    fun `seed traz marca Monarca e crud de marca e modelo`() = testApplication {
        configure()
        withAuth { token ->
            val marcas = Json.parseToJsonElement(client.get("/marcas") { auth(token) }.bodyAsText()).jsonArray
            assertTrue(marcas.any { it.jsonObject["nome"]!!.jsonPrimitive.content == "Monarca" })

            val n = System.nanoTime()
            val marca = client.post("/marcas") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody("""{"nome":"Outra $n"}""")
            }
            assertEquals(HttpStatusCode.Created, marca.status, marca.bodyAsText())
            val idMarca = Json.parseToJsonElement(marca.bodyAsText()).jsonObject["id"]!!.jsonPrimitive.long

            val dup = client.post("/marcas") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody("""{"nome":"Outra $n"}""")
            }
            assertEquals(HttpStatusCode.BadRequest, dup.status)
            assertEquals("MARCA_NOME_DUPLICADO", Json.parseToJsonElement(dup.bodyAsText()).jsonObject["codigo"]!!.jsonPrimitive.content)

            val modelo = client.post("/modelos") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody("""{"idMarca":$idMarca,"nome":"Carla Sofia $n","tipo":"moto"}""")
            }
            assertEquals(HttpStatusCode.Created, modelo.status, modelo.bodyAsText())
            val idModelo = Json.parseToJsonElement(modelo.bodyAsText()).jsonObject["id"]!!.jsonPrimitive.long
            assertEquals("moto", Json.parseToJsonElement(modelo.bodyAsText()).jsonObject["tipo"]!!.jsonPrimitive.content)

            val produto = client.post("/produtos") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody("""{"codigo":"CS-$n","idMarca":$idMarca,"idModelo":$idModelo,"tipo":"moto","moto":{"anoFabricacao":2026,"anoModelo":2026}}""")
            }
            assertEquals(HttpStatusCode.Created, produto.status, produto.bodyAsText())
            val body = Json.parseToJsonElement(produto.bodyAsText()).jsonObject
            assertEquals("Outra $n Carla Sofia $n", body["nome"]!!.jsonPrimitive.content)

            val semAno = client.post("/produtos") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody("""{"codigo":"SA-$n","idMarca":$idMarca,"idModelo":$idModelo,"tipo":"moto"}""")
            }
            assertEquals(HttpStatusCode.BadRequest, semAno.status)

            assertEquals(HttpStatusCode.BadRequest, client.delete("/modelos/$idModelo") { auth(token) }.status)
            assertEquals(HttpStatusCode.BadRequest, client.delete("/marcas/$idMarca") { auth(token) }.status)
        }
    }

    @Test
    fun `operador consulta marcas e vendedor nao gerencia`() = testApplication {
        configure()
        withAuth { admin ->
            val operador = criarELogar(admin, "operador")
            val vendedor = criarELogar(admin, "vendedor")
            assertEquals(HttpStatusCode.OK, client.get("/marcas") { auth(operador) }.status)
            assertEquals(HttpStatusCode.OK, client.get("/modelos") { auth(operador) }.status)
            assertEquals(HttpStatusCode.OK, client.get("/marcas") { auth(vendedor) }.status)
            assertEquals(
                HttpStatusCode.Forbidden,
                client.post("/marcas") {
                    auth(vendedor)
                    contentType(ContentType.Application.Json)
                    setBody("""{"nome":"X"}""")
                }.status,
            )
        }
    }
}
