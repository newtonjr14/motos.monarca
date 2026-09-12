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
import kotlinx.serialization.json.boolean
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
                    """{"codigo":"MTR-$n","idMarca":$idMarca,"idModelo":$idModelo,"tipo":"moto","moto":{"anoFabricacao":2026,"anoModelo":2026,"cor":"Preto","potenciaMotorW":3000},"numerosIniciais":["CHS$n"]}""",
                )
            }
            assertEquals(HttpStatusCode.Created, created.status, created.bodyAsText())
            val produto = Json.parseToJsonElement(created.bodyAsText()).jsonObject
            val id = produto["id"]!!.jsonPrimitive.long
            assertEquals("MTR-$n", produto["codigo"]!!.jsonPrimitive.content)
            assertEquals("moto", produto["tipo"]!!.jsonPrimitive.content)
            assertEquals(true, produto["controlaChassi"]!!.jsonPrimitive.boolean)
            assertEquals("Monarca", produto["marca"]!!.jsonPrimitive.content)
            assertEquals("Urban $n", produto["modelo"]!!.jsonPrimitive.content)
            assertEquals("Monarca Urban $n", produto["nome"]!!.jsonPrimitive.content)
            assertEquals("Preto", produto["moto"]!!.jsonObject["cor"]!!.jsonPrimitive.content)
            val unidades = Json.parseToJsonElement(client.get("/produtos/$id/unidades") { auth(token) }.bodyAsText()).jsonArray
            assertEquals(1, unidades.size)
            assertEquals("CHS$n", unidades.first().jsonObject["numero"]!!.jsonPrimitive.content)
            assertEquals("disponivel", unidades.first().jsonObject["situacao"]!!.jsonPrimitive.content)
            assertEquals(1, produto["quantidadeDisponivel"]!!.jsonPrimitive.int)
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
                    """{"codigo":"MTR-$n","idMarca":$idMarca,"idModelo":$idModelo,"tipo":"moto","moto":{"anoFabricacao":2026,"anoModelo":2026,"cor":"Vermelho"}}""",
                )
            }
            assertEquals(HttpStatusCode.OK, updated.status)
            assertEquals("Vermelho", Json.parseToJsonElement(updated.bodyAsText()).jsonObject["moto"]!!.jsonObject["cor"]!!.jsonPrimitive.content)
            assertEquals("Monarca Urban $n", Json.parseToJsonElement(updated.bodyAsText()).jsonObject["nome"]!!.jsonPrimitive.content)

            val lista = Json.parseToJsonElement(client.get("/produtos") { auth(token) }.bodyAsText()).jsonArray
            assertTrue(lista.any { it.jsonObject["id"]!!.jsonPrimitive.long == id })

            val idUnidade = unidades.first().jsonObject["id"]!!.jsonPrimitive.long
            assertEquals(HttpStatusCode.NoContent, client.delete("/produtos/$id/unidades/$idUnidade") { auth(token) }.status)
            assertEquals(HttpStatusCode.NoContent, client.delete("/produtos/$id") { auth(token) }.status)
        }
    }

    @Test
    fun `produto nome customizado persiste e vazio e rejeitado`() = testApplication {
        configure()
        withAuth { token ->
            val n = System.nanoTime()
            val (idMarca, idModelo) = criarModelo(token, "moto", "Urban $n")
            val created = client.post("/produtos") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(
                    """{"codigo":"NM-$n","nome":"Caloi Andes Preta","idMarca":$idMarca,"idModelo":$idModelo,"tipo":"moto","moto":{"anoFabricacao":2026,"anoModelo":2026}}""",
                )
            }
            assertEquals(HttpStatusCode.Created, created.status, created.bodyAsText())
            val id = Json.parseToJsonElement(created.bodyAsText()).jsonObject["id"]!!.jsonPrimitive.long
            assertEquals("Caloi Andes Preta", Json.parseToJsonElement(created.bodyAsText()).jsonObject["nome"]!!.jsonPrimitive.content)

            val vazio = client.post("/produtos") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(
                    """{"codigo":"NV-$n","nome":"","idMarca":$idMarca,"idModelo":$idModelo,"tipo":"moto","moto":{"anoFabricacao":2026,"anoModelo":2026}}""",
                )
            }
            assertEquals(HttpStatusCode.BadRequest, vazio.status)
            assertEquals("PRODUTO_NOME_OBRIGATORIO", Json.parseToJsonElement(vazio.bodyAsText()).jsonObject["codigo"]!!.jsonPrimitive.content)

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
            val idEstoque = Json.parseToJsonElement(client.get("/filiais/principal") { auth(token) }.bodyAsText())
                .jsonObject["idEstoquePadrao"]!!.jsonPrimitive.long

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
    fun `venda e lista usam so o estoque padrao da filial`() = testApplication {
        configure()
        withAuth { token ->
            val n = System.nanoTime()
            val (idMarca, idModelo) = criarModelo(token, "bicicleta", "Padrao $n")
            val produto = client.post("/produtos") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody("""{"codigo":"PD-$n","idMarca":$idMarca,"idModelo":$idModelo,"tipo":"bicicleta"}""")
            }
            assertEquals(HttpStatusCode.Created, produto.status, produto.bodyAsText())
            val idProduto = Json.parseToJsonElement(produto.bodyAsText()).jsonObject["id"]!!.jsonPrimitive.long
            val filialJson = Json.parseToJsonElement(client.get("/filiais/principal") { auth(token) }.bodyAsText()).jsonObject
            val idFilial = filialJson["id"]!!.jsonPrimitive.long
            val idPadrao = filialJson["idEstoquePadrao"]!!.jsonPrimitive.long
            val padraoNome = Json.parseToJsonElement(client.get("/estoques/$idPadrao") { auth(token) }.bodyAsText())
                .jsonObject["nome"]!!.jsonPrimitive.content

            val patio = client.post("/estoques") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody("""{"idFilial":$idFilial,"nome":"Patio $n"}""")
            }
            assertEquals(HttpStatusCode.Created, patio.status, patio.bodyAsText())
            val idPatio = Json.parseToJsonElement(patio.bodyAsText()).jsonObject["id"]!!.jsonPrimitive.long
            assertEquals(
                idPadrao,
                Json.parseToJsonElement(client.get("/filiais/$idFilial") { auth(token) }.bodyAsText())
                    .jsonObject["idEstoquePadrao"]!!.jsonPrimitive.long,
            )

            val itemPadrao = Json.parseToJsonElement(
                client.get("/estoque-produtos?idEstoque=$idPadrao") { auth(token) }.bodyAsText(),
            ).jsonArray.first { it.jsonObject["idProduto"]!!.jsonPrimitive.long == idProduto }.jsonObject
            val itemPatio = Json.parseToJsonElement(
                client.get("/estoque-produtos?idEstoque=$idPatio") { auth(token) }.bodyAsText(),
            ).jsonArray.first { it.jsonObject["idProduto"]!!.jsonPrimitive.long == idProduto }.jsonObject
            assertEquals(
                HttpStatusCode.OK,
                client.put("/estoque-produtos/${itemPadrao["id"]!!.jsonPrimitive.long}") {
                    auth(token)
                    contentType(ContentType.Application.Json)
                    setBody("""{"idEstoque":$idPadrao,"idProduto":$idProduto,"quantidade":3,"quantidadeReservada":0}""")
                }.status,
            )
            assertEquals(
                HttpStatusCode.OK,
                client.put("/estoque-produtos/${itemPatio["id"]!!.jsonPrimitive.long}") {
                    auth(token)
                    contentType(ContentType.Application.Json)
                    setBody("""{"idEstoque":$idPatio,"idProduto":$idProduto,"quantidade":40,"quantidadeReservada":0}""")
                }.status,
            )

            val lista = Json.parseToJsonElement(client.get("/produtos") { auth(token) }.bodyAsText()).jsonArray
            val naLista = lista.first { it.jsonObject["id"]!!.jsonPrimitive.long == idProduto }.jsonObject
            assertEquals(3, naLista["quantidadeDisponivel"]!!.jsonPrimitive.int)

            val inativar = client.put("/estoques/$idPadrao") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody("""{"idFilial":$idFilial,"nome":"$padraoNome","status":"inativo"}""")
            }
            assertEquals(HttpStatusCode.BadRequest, inativar.status)
            assertEquals(
                "ESTOQUE_PADRAO_INATIVO",
                Json.parseToJsonElement(inativar.bodyAsText()).jsonObject["codigo"]!!.jsonPrimitive.content,
            )

            val promover = client.put("/filiais/$idFilial") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(
                    """{"idEmpresa":${filialJson["idEmpresa"]!!.jsonPrimitive.long},"nome":${filialJson["nome"]},"principal":${filialJson["principal"]},"idEstoquePadrao":$idPatio}""",
                )
            }
            assertEquals(HttpStatusCode.OK, promover.status, promover.bodyAsText())
            assertEquals(idPatio, Json.parseToJsonElement(promover.bodyAsText()).jsonObject["idEstoquePadrao"]!!.jsonPrimitive.long)

            val listaPatio = Json.parseToJsonElement(client.get("/produtos") { auth(token) }.bodyAsText()).jsonArray
            val naListaPatio = listaPatio.first { it.jsonObject["id"]!!.jsonPrimitive.long == idProduto }.jsonObject
            assertEquals(40, naListaPatio["quantidadeDisponivel"]!!.jsonPrimitive.int)

            val ficha = Json.parseToJsonElement(
                client.get("/produtos/$idProduto?idFilial=$idFilial") { auth(token) }.bodyAsText(),
            ).jsonObject
            val depositos = ficha["estoques"]!!.jsonArray
            assertEquals(true, depositos.first { it.jsonObject["idEstoque"]!!.jsonPrimitive.long == idPatio }.jsonObject["padrao"]!!.jsonPrimitive.boolean)
            assertEquals(false, depositos.first { it.jsonObject["idEstoque"]!!.jsonPrimitive.long == idPadrao }.jsonObject["padrao"]!!.jsonPrimitive.boolean)

            val restaurar = client.put("/filiais/$idFilial") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(
                    """{"idEmpresa":${filialJson["idEmpresa"]!!.jsonPrimitive.long},"nome":${filialJson["nome"]},"principal":${filialJson["principal"]},"idEstoquePadrao":$idPadrao}""",
                )
            }
            assertEquals(HttpStatusCode.OK, restaurar.status, restaurar.bodyAsText())
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

    @Test
    fun `produto novo quantidade inicial no padrao e codigo vazio vira id`() = testApplication {
        configure()
        withAuth { token ->
            val n = System.nanoTime()
            val (idMarca, idModelo) = criarModelo(token, "bicicleta", "Ini $n")
            val created = client.post("/produtos") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(
                    """{"codigo":"","idMarca":$idMarca,"idModelo":$idModelo,"tipo":"bicicleta","quantidadeInicial":7}""",
                )
            }
            assertEquals(HttpStatusCode.Created, created.status, created.bodyAsText())
            val body = Json.parseToJsonElement(created.bodyAsText()).jsonObject
            val id = body["id"]!!.jsonPrimitive.long
            assertEquals(id.toString(), body["codigo"]!!.jsonPrimitive.content)
            assertEquals(7, body["quantidadeDisponivel"]!!.jsonPrimitive.int)

            val idPadrao = Json.parseToJsonElement(client.get("/filiais/principal") { auth(token) }.bodyAsText())
                .jsonObject["idEstoquePadrao"]!!.jsonPrimitive.long
            val noPadrao = Json.parseToJsonElement(
                client.get("/estoque-produtos?idEstoque=$idPadrao") { auth(token) }.bodyAsText(),
            ).jsonArray.first { it.jsonObject["idProduto"]!!.jsonPrimitive.long == id }.jsonObject
            assertEquals(7, noPadrao["quantidade"]!!.jsonPrimitive.int)
        }
    }

    @Test
    fun `produto rejeita sku duplicado e altera so o status`() = testApplication {
        configure()
        withAuth { token ->
            val n = System.nanoTime()
            val (idMarca, idModelo) = criarModelo(token, "moto", "Sku $n")
            val primeiro = client.post("/produtos") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(
                    """{"codigo":"SKU-$n","idMarca":$idMarca,"idModelo":$idModelo,"tipo":"moto","moto":{"anoFabricacao":2026,"anoModelo":2026}}""",
                )
            }
            assertEquals(HttpStatusCode.Created, primeiro.status, primeiro.bodyAsText())
            val id = Json.parseToJsonElement(primeiro.bodyAsText()).jsonObject["id"]!!.jsonPrimitive.long

            val duplicado = client.post("/produtos") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(
                    """{"codigo":"SKU-$n","idMarca":$idMarca,"idModelo":$idModelo,"tipo":"moto","moto":{"anoFabricacao":2026,"anoModelo":2026}}""",
                )
            }
            assertEquals(HttpStatusCode.BadRequest, duplicado.status, duplicado.bodyAsText())
            assertEquals(
                "PRODUTO_CODIGO_DUPLICADO",
                Json.parseToJsonElement(duplicado.bodyAsText()).jsonObject["codigo"]!!.jsonPrimitive.content,
            )

            val inativo = client.put("/produtos/$id/status") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody("""{"status":"inativo"}""")
            }
            assertEquals(HttpStatusCode.OK, inativo.status, inativo.bodyAsText())
            assertEquals("inativo", Json.parseToJsonElement(inativo.bodyAsText()).jsonObject["status"]!!.jsonPrimitive.content)
        }
    }

    @Test
    fun `controlaChassi default por tipo e imutavel na edicao`() = testApplication {
        configure()
        withAuth { token ->
            val n = System.nanoTime()
            val (idMarcaMoto, idModeloMoto) = criarModelo(token, "moto", "FlagM $n")
            val (idMarcaBike, idModeloBike) = criarModelo(token, "bicicleta", "FlagB $n")

            val moto = client.post("/produtos") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(
                    """{"codigo":"FM-$n","idMarca":$idMarcaMoto,"idModelo":$idModeloMoto,"tipo":"moto","moto":{"anoFabricacao":2026,"anoModelo":2026}}""",
                )
            }
            assertEquals(HttpStatusCode.Created, moto.status, moto.bodyAsText())
            val motoBody = Json.parseToJsonElement(moto.bodyAsText()).jsonObject
            val idMoto = motoBody["id"]!!.jsonPrimitive.long
            assertEquals(true, motoBody["controlaChassi"]!!.jsonPrimitive.boolean)

            val bike = client.post("/produtos") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(
                    """{"codigo":"FB-$n","idMarca":$idMarcaBike,"idModelo":$idModeloBike,"tipo":"bicicleta","quantidadeInicial":3}""",
                )
            }
            assertEquals(HttpStatusCode.Created, bike.status, bike.bodyAsText())
            val bikeBody = Json.parseToJsonElement(bike.bodyAsText()).jsonObject
            val idBike = bikeBody["id"]!!.jsonPrimitive.long
            assertEquals(false, bikeBody["controlaChassi"]!!.jsonPrimitive.boolean)
            assertEquals(3, bikeBody["quantidadeDisponivel"]!!.jsonPrimitive.int)

            val mudaMoto = client.put("/produtos/$idMoto") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(
                    """{"codigo":"FM-$n","idMarca":$idMarcaMoto,"idModelo":$idModeloMoto,"tipo":"moto","controlaChassi":false,"moto":{"anoFabricacao":2026,"anoModelo":2026}}""",
                )
            }
            assertEquals(HttpStatusCode.BadRequest, mudaMoto.status, mudaMoto.bodyAsText())
            assertEquals(
                "CONTROLA_CHASSI_IMUTAVEL",
                Json.parseToJsonElement(mudaMoto.bodyAsText()).jsonObject["codigo"]!!.jsonPrimitive.content,
            )

            val bikeComChassi = client.post("/produtos/$idBike/unidades") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody("""{"numeros":["BK$n"]}""")
            }
            assertEquals(HttpStatusCode.BadRequest, bikeComChassi.status)
            assertEquals(
                "CHASSI_NAO_CONTROLADO",
                Json.parseToJsonElement(bikeComChassi.bodyAsText()).jsonObject["codigo"]!!.jsonPrimitive.content,
            )

            val bikeComFlag = client.post("/produtos") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(
                    """{"codigo":"FBC-$n","idMarca":$idMarcaBike,"idModelo":$idModeloBike,"tipo":"bicicleta","controlaChassi":true,"numerosIniciais":["BC$n"]}""",
                )
            }
            assertEquals(HttpStatusCode.Created, bikeComFlag.status, bikeComFlag.bodyAsText())
            val bikeFlag = Json.parseToJsonElement(bikeComFlag.bodyAsText()).jsonObject
            assertEquals(true, bikeFlag["controlaChassi"]!!.jsonPrimitive.boolean)
            assertEquals(1, bikeFlag["quantidadeDisponivel"]!!.jsonPrimitive.int)

            val motoSemFlag = client.post("/produtos") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(
                    """{"codigo":"FMQ-$n","idMarca":$idMarcaMoto,"idModelo":$idModeloMoto,"tipo":"moto","controlaChassi":false,"quantidadeInicial":4,"moto":{"anoFabricacao":2026,"anoModelo":2026}}""",
                )
            }
            assertEquals(HttpStatusCode.Created, motoSemFlag.status, motoSemFlag.bodyAsText())
            val motoQtd = Json.parseToJsonElement(motoSemFlag.bodyAsText()).jsonObject
            assertEquals(false, motoQtd["controlaChassi"]!!.jsonPrimitive.boolean)
            assertEquals(4, motoQtd["quantidadeDisponivel"]!!.jsonPrimitive.int)
        }
    }

    @Test
    fun `moto entra com intervalo de chassi e rejeita duplicado`() = testApplication {
        configure()
        withAuth { token ->
            val n = System.nanoTime()
            val (idMarca, idModelo) = criarModelo(token, "moto", "Lote $n")
            val created = client.post("/produtos") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(
                    """{"codigo":"LOT-$n","idMarca":$idMarca,"idModelo":$idModelo,"tipo":"moto","moto":{"anoFabricacao":2026,"anoModelo":2026},"numerosIniciais":["HD5BL${n}SA063647~HD5BL${n}SA063696"]}""",
                )
            }
            assertEquals(HttpStatusCode.Created, created.status, created.bodyAsText())
            val produto = Json.parseToJsonElement(created.bodyAsText()).jsonObject
            val id = produto["id"]!!.jsonPrimitive.long
            assertEquals(50, produto["quantidadeDisponivel"]!!.jsonPrimitive.int)
            val unidades = Json.parseToJsonElement(client.get("/produtos/$id/unidades") { auth(token) }.bodyAsText()).jsonArray
            assertEquals(50, unidades.size)
            assertEquals("HD5BL${n}SA063647", unidades.first().jsonObject["numero"]!!.jsonPrimitive.content)
            assertEquals("HD5BL${n}SA063696", unidades.last().jsonObject["numero"]!!.jsonPrimitive.content)

            val extra = client.post("/produtos/$id/unidades") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody("""{"numeros":["HD5BL${n}SA063647"]}""")
            }
            assertEquals(HttpStatusCode.BadRequest, extra.status)
            assertEquals("CHASSI_DUPLICADO", Json.parseToJsonElement(extra.bodyAsText()).jsonObject["codigo"]!!.jsonPrimitive.content)

            val repetido = client.post("/produtos") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(
                    """{"codigo":"DUP-$n","idMarca":$idMarca,"idModelo":$idModelo,"tipo":"moto","moto":{"anoFabricacao":2026,"anoModelo":2026},"numerosIniciais":["AAA$n","AAA$n"]}""",
                )
            }
            assertEquals(HttpStatusCode.BadRequest, repetido.status)
            assertEquals("CHASSI_DUPLICADO", Json.parseToJsonElement(repetido.bodyAsText()).jsonObject["codigo"]!!.jsonPrimitive.content)

            val idUnidade = unidades.first().jsonObject["id"]!!.jsonPrimitive.long
            assertEquals(HttpStatusCode.NoContent, client.delete("/produtos/$id/unidades/$idUnidade") { auth(token) }.status)
            val depois = Json.parseToJsonElement(client.get("/produtos/$id/unidades") { auth(token) }.bodyAsText()).jsonArray
            assertEquals(49, depois.size)
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
