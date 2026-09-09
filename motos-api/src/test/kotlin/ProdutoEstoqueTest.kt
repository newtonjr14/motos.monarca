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
import kotlinx.serialization.json.int
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.long

class ProdutoEstoqueTest {

    @Test
    fun `produto moto tem crud com chassi e cor`() = testApplication {
        configure()
        withAuth { token ->
            val n = System.nanoTime()
            val (idMarca, idModelo) = criarModelo(token, "moto", "Urban $n")
            val created = client.post("/produtos") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(
                    """{"codigo":"MTR-$n","idMarca":$idMarca,"idModelo":$idModelo,"tipo":"moto","moto":{"anoFabricacao":2026,"anoModelo":2026,"chassi":"CHS$n","cor":"Preto","potenciaMotorW":3000}}""",
                )
            }
            assertEquals(HttpStatusCode.Created, created.status, created.bodyAsText())
            val produto = Json.parseToJsonElement(created.bodyAsText()).jsonObject
            val id = produto["id"]!!.jsonPrimitive.long
            assertEquals("MTR-$n", produto["codigo"]!!.jsonPrimitive.content)
            assertEquals("moto", produto["tipo"]!!.jsonPrimitive.content)
            assertEquals("Monarca", produto["marca"]!!.jsonPrimitive.content)
            assertEquals("Urban $n", produto["modelo"]!!.jsonPrimitive.content)
            assertEquals("Monarca Urban $n", produto["nome"]!!.jsonPrimitive.content)
            assertEquals("CHS$n", produto["moto"]!!.jsonObject["chassi"]!!.jsonPrimitive.content)
            assertEquals("Preto", produto["moto"]!!.jsonObject["cor"]!!.jsonPrimitive.content)
            assertEquals(2026, produto["moto"]!!.jsonObject["anoFabricacao"]!!.jsonPrimitive.int)
            assertEquals(2026, produto["moto"]!!.jsonObject["anoModelo"]!!.jsonPrimitive.int)
            assertEquals(10, produto["aliquotaIva"]!!.jsonPrimitive.int)
            val moedaOp = Json.parseToJsonElement(client.get("/filiais/principal") { auth(token) }.bodyAsText())
                .jsonObject["moedaOperacao"]!!.jsonPrimitive.content
            assertEquals(moedaOp, produto["moedaPreco"]!!.jsonPrimitive.content)
            assertEquals(0.0, produto["precoLista"]!!.jsonPrimitive.content.toDouble())

            val updated = client.put("/produtos/$id") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(
                    """{"codigo":"MTR-$n","idMarca":$idMarca,"idModelo":$idModelo,"tipo":"moto","moto":{"anoFabricacao":2026,"anoModelo":2026,"chassi":"CHS$n","cor":"Vermelho"}}""",
                )
            }
            assertEquals(HttpStatusCode.OK, updated.status)
            assertEquals("Vermelho", Json.parseToJsonElement(updated.bodyAsText()).jsonObject["moto"]!!.jsonObject["cor"]!!.jsonPrimitive.content)
            assertEquals("Monarca Urban $n", Json.parseToJsonElement(updated.bodyAsText()).jsonObject["nome"]!!.jsonPrimitive.content)

            val lista = Json.parseToJsonElement(client.get("/produtos") { auth(token) }.bodyAsText()).jsonArray
            assertTrue(lista.any { it.jsonObject["id"]!!.jsonPrimitive.long == id })

            assertEquals(HttpStatusCode.NoContent, client.delete("/produtos/$id") { auth(token) }.status)
        }
    }

    @Test
    fun `produto bicicleta tem cor e nao troca tipo`() = testApplication {
        configure()
        withAuth { token ->
            val n = System.nanoTime()
            val (idMarca, idModelo) = criarModelo(token, "bicicleta", "City $n")
            val created = client.post("/produtos") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(
                    """{"codigo":"BIC-$n","idMarca":$idMarca,"idModelo":$idModelo,"tipo":"bicicleta","bicicleta":{"cor":"Azul","aro":"29"}}""",
                )
            }
            assertEquals(HttpStatusCode.Created, created.status, created.bodyAsText())
            val id = Json.parseToJsonElement(created.bodyAsText()).jsonObject["id"]!!.jsonPrimitive.long
            assertEquals("Azul", Json.parseToJsonElement(created.bodyAsText()).jsonObject["bicicleta"]!!.jsonObject["cor"]!!.jsonPrimitive.content)

            val trocaTipo = client.put("/produtos/$id") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody("""{"codigo":"BIC-$n","idMarca":$idMarca,"idModelo":$idModelo,"tipo":"moto"}""")
            }
            assertEquals(HttpStatusCode.BadRequest, trocaTipo.status)
        }
    }

    @Test
    fun `produto vincula segunda filial com confirmacao`() = testApplication {
        configure()
        withAuth { token ->
            val n = System.nanoTime()
            val (idMarca, idModelo) = criarModelo(token, "moto", "Vinculo $n")
            val created = client.post("/produtos") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody("""{"codigo":"SKU-$n","idMarca":$idMarca,"idModelo":$idModelo,"tipo":"moto","moto":{"anoFabricacao":2026,"anoModelo":2026}}""")
            }
            assertEquals(HttpStatusCode.Created, created.status, created.bodyAsText())

            val empresaId = Json.parseToJsonElement(client.get("/empresas") { auth(token) }.bodyAsText())
                .jsonArray.first().jsonObject["id"]!!.jsonPrimitive.long
            val filial2 = client.post("/filiais") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody("""{"idEmpresa":$empresaId,"nome":"Sucursal Prod $n","principal":false}""")
            }
            assertEquals(HttpStatusCode.Created, filial2.status, filial2.bodyAsText())
            val idFilial2 = Json.parseToJsonElement(filial2.bodyAsText()).jsonObject["id"]!!.jsonPrimitive.long

            val semConfirmar = client.post("/produtos") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody("""{"codigo":"SKU-$n","idMarca":$idMarca,"idModelo":$idModelo,"tipo":"moto","moto":{"anoFabricacao":2026,"anoModelo":2026},"idFilialCadastro":$idFilial2}""")
            }
            assertEquals(HttpStatusCode.Conflict, semConfirmar.status)
            assertEquals("VINCULO_FILIAL", Json.parseToJsonElement(semConfirmar.bodyAsText()).jsonObject["codigo"]!!.jsonPrimitive.content)

            val comConfirmar = client.post("/produtos") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody("""{"codigo":"SKU-$n","idMarca":$idMarca,"idModelo":$idModelo,"tipo":"moto","moto":{"anoFabricacao":2026,"anoModelo":2026},"idFilialCadastro":$idFilial2,"confirmarVinculoFilial":true}""")
            }
            assertEquals(HttpStatusCode.Created, comConfirmar.status, comConfirmar.bodyAsText())
            val idProduto = Json.parseToJsonElement(created.bodyAsText()).jsonObject["id"]!!.jsonPrimitive.long
            val itensFilial2 = Json.parseToJsonElement(
                client.get("/estoque-produtos?idFilial=$idFilial2") { auth(token) }.bodyAsText(),
            ).jsonArray
            assertTrue(itensFilial2.any { it.jsonObject["idProduto"]!!.jsonPrimitive.long == idProduto })
        }
    }

    @Test
    fun `estoque por filial e quantidade com reserva`() = testApplication {
        configure()
        withAuth { token ->
            val n = System.nanoTime()
            val (idMarca, idModelo) = criarModelo(token, "bicicleta", "Peca $n")
            val produto = client.post("/produtos") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody("""{"codigo":"EST-$n","idMarca":$idMarca,"idModelo":$idModelo,"tipo":"bicicleta"}""")
            }
            assertEquals(HttpStatusCode.Created, produto.status, produto.bodyAsText())
            val idProduto = Json.parseToJsonElement(produto.bodyAsText()).jsonObject["id"]!!.jsonPrimitive.long

            val estoques = Json.parseToJsonElement(client.get("/estoques") { auth(token) }.bodyAsText()).jsonArray
            assertTrue(estoques.isNotEmpty())
            val idEstoque = estoques.first().jsonObject["id"]!!.jsonPrimitive.long

            val zerados = Json.parseToJsonElement(
                client.get("/estoque-produtos?idEstoque=$idEstoque") { auth(token) }.bodyAsText(),
            ).jsonArray
            val seed = zerados.first { it.jsonObject["idProduto"]!!.jsonPrimitive.long == idProduto }.jsonObject
            assertEquals(0, seed["quantidade"]!!.jsonPrimitive.int)
            val idItem = seed["id"]!!.jsonPrimitive.long

            val item = client.put("/estoque-produtos/$idItem") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody("""{"idEstoque":$idEstoque,"idProduto":$idProduto,"quantidade":10,"quantidadeReservada":2}""")
            }
            assertEquals(HttpStatusCode.OK, item.status, item.bodyAsText())
            val body = Json.parseToJsonElement(item.bodyAsText()).jsonObject
            assertEquals(10, body["quantidade"]!!.jsonPrimitive.int)
            assertEquals(2, body["quantidadeReservada"]!!.jsonPrimitive.int)
            assertEquals(8, body["quantidadeDisponivel"]!!.jsonPrimitive.int)

            val lista = Json.parseToJsonElement(client.get("/produtos") { auth(token) }.bodyAsText()).jsonArray
            val naLista = lista.first { it.jsonObject["id"]!!.jsonPrimitive.long == idProduto }.jsonObject
            assertEquals(10, naLista["quantidade"]!!.jsonPrimitive.int)
            assertEquals(2, naLista["quantidadeReservada"]!!.jsonPrimitive.int)
            assertEquals(8, naLista["quantidadeDisponivel"]!!.jsonPrimitive.int)

            val idFilial = Json.parseToJsonElement(client.get("/filiais/principal") { auth(token) }.bodyAsText())
                .jsonObject["id"]!!.jsonPrimitive.long
            val ficha = Json.parseToJsonElement(
                client.get("/produtos/$idProduto?idFilial=$idFilial") { auth(token) }.bodyAsText(),
            ).jsonObject
            assertEquals(8, ficha["quantidadeDisponivel"]!!.jsonPrimitive.int)
            val depositos = ficha["estoques"]!!.jsonArray
            assertTrue(depositos.any { it.jsonObject["quantidadeDisponivel"]!!.jsonPrimitive.int == 8 })

            val invalido = client.post("/estoque-produtos") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody("""{"idEstoque":$idEstoque,"idProduto":$idProduto,"quantidade":1,"quantidadeReservada":5}""")
            }
            assertEquals(HttpStatusCode.BadRequest, invalido.status)
        }
    }

    @Test
    fun `estoque novo recebe produtos da filial com quantidade zero`() = testApplication {
        configure()
        withAuth { token ->
            val n = System.nanoTime()
            val (idMarca, idModelo) = criarModelo(token, "moto", "Zero $n")
            val produto = client.post("/produtos") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody("""{"codigo":"NZ-$n","idMarca":$idMarca,"idModelo":$idModelo,"tipo":"moto","moto":{"anoFabricacao":2026,"anoModelo":2026}}""")
            }
            assertEquals(HttpStatusCode.Created, produto.status, produto.bodyAsText())
            val idProduto = Json.parseToJsonElement(produto.bodyAsText()).jsonObject["id"]!!.jsonPrimitive.long
            val idFilial = Json.parseToJsonElement(client.get("/filiais/principal") { auth(token) }.bodyAsText())
                .jsonObject["id"]!!.jsonPrimitive.long

            val novo = client.post("/estoques") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody("""{"idFilial":$idFilial,"nome":"Showroom $n"}""")
            }
            assertEquals(HttpStatusCode.Created, novo.status, novo.bodyAsText())
            val idEstoque = Json.parseToJsonElement(novo.bodyAsText()).jsonObject["id"]!!.jsonPrimitive.long
            val itens = Json.parseToJsonElement(
                client.get("/estoque-produtos?idEstoque=$idEstoque") { auth(token) }.bodyAsText(),
            ).jsonArray
            val seed = itens.first { it.jsonObject["idProduto"]!!.jsonPrimitive.long == idProduto }.jsonObject
            assertEquals(0, seed["quantidade"]!!.jsonPrimitive.int)
            assertEquals(0, seed["quantidadeReservada"]!!.jsonPrimitive.int)
        }
    }

    @Test
    fun `operador acessa produto e estoque`() = testApplication {
        configure()
        withAuth { admin ->
            val operador = criarELogar(admin, "operador")
            assertEquals(HttpStatusCode.OK, client.get("/produtos") { auth(operador) }.status)
            assertEquals(HttpStatusCode.OK, client.get("/estoques") { auth(operador) }.status)
        }
    }

    @Test
    fun `criar produto grava saldo zerado e audit_logs`() = testApplication {
        configure()
        withAuth { token ->
            val n = System.nanoTime()
            val (idMarca, idModelo) = criarModelo(token, "moto", "Audit $n")
            val created = client.post("/produtos") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody("""{"codigo":"LOG-$n","idMarca":$idMarca,"idModelo":$idModelo,"tipo":"moto","moto":{"anoFabricacao":2026,"anoModelo":2026}}""")
            }
            assertEquals(HttpStatusCode.Created, created.status, created.bodyAsText())
            val idProduto = Json.parseToJsonElement(created.bodyAsText()).jsonObject["id"]!!.jsonPrimitive.long

            val itens = Json.parseToJsonElement(
                client.get("/estoque-produtos") { auth(token) }.bodyAsText(),
            ).jsonArray
            assertTrue(itens.any {
                val row = it.jsonObject
                row["idProduto"]!!.jsonPrimitive.long == idProduto &&
                    row["quantidade"]!!.jsonPrimitive.int == 0
            })

            val tabelas = tabelasAuditadasDoProduto(idProduto)
            assertTrue("produto" in tabelas, "faltou audit_logs de produto: $tabelas")
            assertTrue("produto_filial" in tabelas, "faltou audit_logs de produto_filial: $tabelas")
            assertTrue("estoque_produto" in tabelas, "faltou audit_logs de estoque_produto: $tabelas")
        }
    }

    @Test
    fun `produto rejeita iva invalido e grava preco`() = testApplication {
        configure()
        withAuth { token ->
            val n = System.nanoTime()
            val (idMarca, idModelo) = criarModelo(token, "moto", "Iva $n")
            val invalido = client.post("/produtos") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(
                    """{"codigo":"IVA-$n","idMarca":$idMarca,"idModelo":$idModelo,"tipo":"moto","aliquotaIva":7,"moto":{"anoFabricacao":2026,"anoModelo":2026}}""",
                )
            }
            assertEquals(HttpStatusCode.BadRequest, invalido.status)
            assertEquals(
                "IVA_ALIQUOTA_INVALIDA",
                Json.parseToJsonElement(invalido.bodyAsText()).jsonObject["codigo"]!!.jsonPrimitive.content,
            )

            val created = client.post("/produtos") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(
                    """{"codigo":"PRC-$n","idMarca":$idMarca,"idModelo":$idModelo,"tipo":"moto","aliquotaIva":5,"moedaPreco":"pyg","precoLista":1500000,"custo":900000,"moto":{"anoFabricacao":2026,"anoModelo":2026}}""",
                )
            }
            assertEquals(HttpStatusCode.Created, created.status, created.bodyAsText())
            val body = Json.parseToJsonElement(created.bodyAsText()).jsonObject
            assertEquals(5, body["aliquotaIva"]!!.jsonPrimitive.int)
            val moedaOp = Json.parseToJsonElement(client.get("/filiais/principal") { auth(token) }.bodyAsText())
                .jsonObject["moedaOperacao"]!!.jsonPrimitive.content
            assertEquals(moedaOp, body["moedaPreco"]!!.jsonPrimitive.content)
            assertEquals(1_500_000.0, body["precoLista"]!!.jsonPrimitive.content.toDouble())
            assertEquals(900_000.0, body["custo"]!!.jsonPrimitive.content.toDouble())
        }
    }
}

private fun tabelasAuditadasDoProduto(idProduto: Long): Set<String> {
    val url =
        "jdbc:h2:mem:localidade_test;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE"
    java.sql.DriverManager.getConnection(url, "root", "").use { conn ->
        conn.prepareStatement(
            """
            SELECT table_name FROM audit_logs
            WHERE (table_name = 'produto' AND record_id = ?)
               OR (table_name IN ('produto_filial', 'estoque_produto') AND new_values LIKE ?)
            """.trimIndent(),
        ).use { ps ->
            ps.setString(1, idProduto.toString())
            ps.setString(2, """%"idProduto":$idProduto%""")
            ps.executeQuery().use { rs ->
                val tabelas = mutableSetOf<String>()
                while (rs.next()) {
                    tabelas += rs.getString(1)
                }
                return tabelas
            }
        }
    }
}
