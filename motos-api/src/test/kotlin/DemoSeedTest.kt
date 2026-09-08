package com.monarca

import io.ktor.client.request.delete
import io.ktor.client.request.get
import io.ktor.client.request.post
import io.ktor.client.statement.bodyAsText
import io.ktor.http.HttpStatusCode
import io.ktor.server.testing.testApplication
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.boolean
import kotlinx.serialization.json.int
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

class DemoSeedTest {

    @Test
    fun `seed demo aplica e remove clientes produtos caixas e vendas`() = testApplication {
        configure()
        withAuth { token ->
            try {
                val antes = Json.parseToJsonElement(client.get("/seed/demo") { auth(token) }.bodyAsText()).jsonObject
                if (antes["aplicado"]!!.jsonPrimitive.boolean) {
                    client.delete("/seed/demo") { auth(token) }
                }

                val aplicado = client.post("/seed/demo") { auth(token) }
                assertEquals(HttpStatusCode.OK, aplicado.status, aplicado.bodyAsText())
                val status = Json.parseToJsonElement(aplicado.bodyAsText()).jsonObject
                assertTrue(status["aplicado"]!!.jsonPrimitive.boolean)
                assertEquals(3, status["clientes"]!!.jsonPrimitive.int)
                assertEquals(3, status["produtos"]!!.jsonPrimitive.int)
                assertEquals(3, status["vendas"]!!.jsonPrimitive.int)
                assertEquals(1, status["caixas"]!!.jsonPrimitive.int)
                assertEquals(1, status["finalizadores"]!!.jsonPrimitive.int)

                val idempotente = client.post("/seed/demo") { auth(token) }
                assertEquals(HttpStatusCode.OK, idempotente.status, idempotente.bodyAsText())
                assertEquals(3, Json.parseToJsonElement(idempotente.bodyAsText()).jsonObject["vendas"]!!.jsonPrimitive.int)

                val produtos = Json.parseToJsonElement(client.get("/produtos") { auth(token) }.bodyAsText()).jsonArray
                assertTrue(produtos.any { it.jsonObject["codigo"]!!.jsonPrimitive.content == "DEMO-B01" })
                assertTrue(produtos.any { it.jsonObject["codigo"]!!.jsonPrimitive.content == "DEMO-M01" })

                val clientes = Json.parseToJsonElement(client.get("/clientes") { auth(token) }.bodyAsText()).jsonArray
                assertTrue(clientes.any { it.jsonObject["pessoa"]!!.jsonObject["nomeRazaoSocial"]!!.jsonPrimitive.content.contains("Ana Pereira", ignoreCase = true) })

                val vendas = Json.parseToJsonElement(client.get("/vendas") { auth(token) }.bodyAsText()).jsonArray
                assertTrue(vendas.count { it.jsonObject["observacao"]?.jsonPrimitive?.content == "[DEMO]" } >= 3)

                val fins = Json.parseToJsonElement(client.get("/finalizadores") { auth(token) }.bodyAsText()).jsonArray
                assertTrue(fins.any { it.jsonObject["nome"]!!.jsonPrimitive.content.equals("Demo Cheque", ignoreCase = true) })

                val caixas = Json.parseToJsonElement(client.get("/caixas") { auth(token) }.bodyAsText()).jsonArray
                assertTrue(caixas.any { it.jsonObject["nome"]!!.jsonPrimitive.content.equals("Demo Caixa 2", ignoreCase = true) })

                val gestor = criarELogar(token, "gestor")
                assertEquals(HttpStatusCode.Forbidden, client.post("/seed/demo") { auth(gestor) }.status)

                val removido = client.delete("/seed/demo") { auth(token) }
                assertEquals(HttpStatusCode.OK, removido.status, removido.bodyAsText())
                val depois = Json.parseToJsonElement(removido.bodyAsText()).jsonObject
                assertFalse(depois["aplicado"]!!.jsonPrimitive.boolean)

                val produtosDepois = Json.parseToJsonElement(client.get("/produtos") { auth(token) }.bodyAsText()).jsonArray
                assertFalse(produtosDepois.any { it.jsonObject["codigo"]!!.jsonPrimitive.content.startsWith("DEMO-") })
                val clientesDepois = Json.parseToJsonElement(client.get("/clientes") { auth(token) }.bodyAsText()).jsonArray
                assertFalse(clientesDepois.any { it.jsonObject["pessoa"]!!.jsonObject["nomeRazaoSocial"]!!.jsonPrimitive.content.startsWith("Demo ") })
            } finally {
                client.delete("/seed/demo") { auth(token) }
            }
        }
    }
}
