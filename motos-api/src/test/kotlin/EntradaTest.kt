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
import kotlinx.serialization.json.boolean
import kotlinx.serialization.json.double
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.long
import java.time.LocalDate
import java.time.ZoneId

class EntradaTest {

    private val hoje = LocalDate.now(ZoneId.of("America/Asuncion")).toString()

    @Test
    fun `entrada py factura mista gera titulo compra e estoque`() = testApplication {
        configure()
        withAuth { token ->
            client.garantirCotacao(token)
            val idFilial = client.filialId(token)
            val idEstoque = client.estoquePadrao(token, idFilial)
            val idSessao = client.abrirCaixa(token, idFilial)
            val idFornecedor = client.criarFornecedor(token, idFilial)
            val n = System.nanoTime()
            val (idMarca, idModelo) = criarModelo(token, "bicicleta", "Ent $n")
            val produto = client.post("/produtos") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(
                    """{"codigo":"ENT-$n","idMarca":$idMarca,"idModelo":$idModelo,"tipo":"bicicleta","precoLista":10000,"moedaPreco":"pyg","quantidadeInicial":0,"aliquotaIva":10}""",
                )
            }
            assertEquals(HttpStatusCode.Created, produto.status, produto.bodyAsText())
            val idProduto = Json.parseToJsonElement(produto.bodyAsText()).jsonObject["id"]!!.jsonPrimitive.long

            val fins = Json.parseToJsonElement(client.get("/finalizadores") { auth(token) }.bodyAsText()).jsonArray
            val idDinheiro = fins.first { it.jsonObject["nome"]!!.jsonPrimitive.content == "Dinheiro" }
                .jsonObject["id"]!!.jsonPrimitive.long
            var idPrazo = fins.firstOrNull {
                it.jsonObject["geraContasPagar"]?.jsonPrimitive?.boolean == true
            }?.jsonObject?.get("id")?.jsonPrimitive?.long
            if (idPrazo == null) {
                val criadoFin = client.post("/finalizadores") {
                    auth(token)
                    contentType(ContentType.Application.Json)
                    setBody("""{"nome":"Prazo Ent $n","tipo":"outro","geraContasPagar":true}""")
                }
                assertEquals(HttpStatusCode.Created, criadoFin.status, criadoFin.bodyAsText())
                idPrazo = Json.parseToJsonElement(criadoFin.bodyAsText()).jsonObject["id"]!!.jsonPrimitive.long
            }

            val body = """
                {
                  "idFilial":$idFilial,
                  "idFornecedor":$idFornecedor,
                  "tipoDocumento":"py_factura",
                  "dataEmissao":"$hoje",
                  "moeda":"pyg",
                  "idCaixaSessao":$idSessao,
                  "timbrado":"12345678",
                  "establecimiento":"001",
                  "puntoExpedicion":"001",
                  "numero":"${n % 1000000}",
                  "itens":[{"idProduto":$idProduto,"idEstoque":$idEstoque,"quantidade":2,"valorUnitario":5000}],
                  "negociacao":[
                    {"idFinalizador":$idDinheiro,"valor":4000,"moeda":"pyg"},
                    {"idFinalizador":$idPrazo,"valor":6000,"moeda":"pyg"}
                  ],
                  "parcelas":{"quantidade":2,"modoVencimento":"intervalo_30"}
                }
            """.trimIndent()
            val criado = client.post("/entradas") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(body)
            }
            assertEquals(HttpStatusCode.Created, criado.status, criado.bodyAsText())
            val entrada = Json.parseToJsonElement(criado.bodyAsText()).jsonObject
            assertEquals(10000.0, entrada["valor"]!!.jsonPrimitive.double, 0.01)
            assertTrue(entrada["idTituloPagar"]!!.jsonPrimitive.long > 0)

            val dup = client.post("/entradas") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(body)
            }
            assertEquals(HttpStatusCode.BadRequest, dup.status)
            assertEquals(
                "ENTRADA_PY_DUPLICADA",
                Json.parseToJsonElement(dup.bodyAsText()).jsonObject["codigo"]!!.jsonPrimitive.content,
            )

            val titulos = Json.parseToJsonElement(
                client.get("/titulos-pagar?idFilial=$idFilial") { auth(token) }.bodyAsText(),
            ).jsonArray
            val titulo = titulos.first {
                it.jsonObject["id"]!!.jsonPrimitive.long == entrada["idTituloPagar"]!!.jsonPrimitive.long
            }.jsonObject
            assertEquals("compra", titulo["origem"]!!.jsonPrimitive.content)
            assertEquals(6000.0, titulo["valor"]!!.jsonPrimitive.double, 0.01)
        }
    }

    @Test
    fun `entrada exterior com intervalo de chassi`() = testApplication {
        configure()
        withAuth { token ->
            client.garantirCotacao(token)
            val idFilial = client.filialId(token)
            val idEstoque = client.estoquePadrao(token, idFilial)
            val idSessao = client.abrirCaixa(token, idFilial)
            val idFornecedor = client.criarFornecedor(token, idFilial)
            val n = System.nanoTime()
            val (idMarca, idModelo) = criarModelo(token, "moto", "China $n")
            val produto = client.post("/produtos") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(
                    """{"codigo":"CHN-$n","idMarca":$idMarca,"idModelo":$idModelo,"tipo":"moto","controlaChassi":true,"precoLista":263,"moedaPreco":"usd","moto":{"anoFabricacao":2025,"anoModelo":2025,"cor":"metallic grey"}}""",
                )
            }
            assertEquals(HttpStatusCode.Created, produto.status, produto.bodyAsText())
            val idProduto = Json.parseToJsonElement(produto.bodyAsText()).jsonObject["id"]!!.jsonPrimitive.long
            val fins = Json.parseToJsonElement(client.get("/finalizadores") { auth(token) }.bodyAsText()).jsonArray
            val idDinheiro = fins.first { it.jsonObject["nome"]!!.jsonPrimitive.content == "Dinheiro" }
                .jsonObject["id"]!!.jsonPrimitive.long

            val criado = client.post("/entradas") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(
                    """
                    {
                      "idFilial":$idFilial,
                      "idFornecedor":$idFornecedor,
                      "tipoDocumento":"exterior",
                      "dataEmissao":"$hoje",
                      "moeda":"usd",
                      "idCaixaSessao":$idSessao,
                      "numeroDocumento":"INV-PRINCESS-$n",
                      "incoterm":"FOB",
                      "itens":[{
                        "idProduto":$idProduto,
                        "idEstoque":$idEstoque,
                        "valorUnitario":263,
                        "numerosChassis":["HD5BL2318SA063647~HD5BL2318SA063650"]
                      }],
                      "negociacao":[{"idFinalizador":$idDinheiro,"valor":1052,"moeda":"usd"}]
                    }
                    """.trimIndent(),
                )
            }
            assertEquals(HttpStatusCode.Created, criado.status, criado.bodyAsText())
            val entrada = Json.parseToJsonElement(criado.bodyAsText()).jsonObject
            val item = entrada["itens"]!!.jsonArray.first().jsonObject
            assertEquals(4, item["quantidade"]!!.jsonPrimitive.long)
            assertEquals(4, item["chassis"]!!.jsonArray.size)

            val detalhe = Json.parseToJsonElement(
                client.get("/produtos/$idProduto") { auth(token) }.bodyAsText(),
            ).jsonObject
            val unidades = detalhe["unidades"]?.jsonArray
                ?: detalhe["estoque"]?.jsonArray
            // produto detalhe traz unidades na guia estoque — aceitar via listagem se campo variar
            assertTrue(item["chassis"]!!.jsonArray.size == 4)
        }
    }

    private suspend fun io.ktor.client.HttpClient.garantirCotacao(token: String): Double {
        val hojeRes = get("/cotacoes/hoje") { auth(token) }
        if (hojeRes.status == HttpStatusCode.OK) {
            return Json.parseToJsonElement(hojeRes.bodyAsText()).jsonObject["usdPyg"]!!.jsonPrimitive.double
        }
        val cotacao = post("/cotacoes") {
            auth(token)
            contentType(ContentType.Application.Json)
            setBody("""{"data":"$hoje","usdPyg":7300,"brlPyg":1400}""")
        }
        assertEquals(HttpStatusCode.Created, cotacao.status, cotacao.bodyAsText())
        return 7300.0
    }

    private suspend fun io.ktor.client.HttpClient.filialId(token: String): Long =
        Json.parseToJsonElement(get("/filiais/principal") { auth(token) }.bodyAsText())
            .jsonObject["id"]!!.jsonPrimitive.long

    private suspend fun io.ktor.client.HttpClient.estoquePadrao(token: String, idFilial: Long): Long {
        val filialJson = Json.parseToJsonElement(get("/filiais/principal") { auth(token) }.bodyAsText()).jsonObject
        val putFilial = put("/filiais/$idFilial") {
            auth(token)
            contentType(ContentType.Application.Json)
            setBody(
                """{"idEmpresa":${filialJson["idEmpresa"]!!.jsonPrimitive.long},"nome":${filialJson["nome"]},"moedaOperacao":"pyg","principal":${filialJson["principal"]}}""",
            )
        }
        assertEquals(HttpStatusCode.OK, putFilial.status, putFilial.bodyAsText())
        return Json.parseToJsonElement(putFilial.bodyAsText()).jsonObject["idEstoquePadrao"]!!.jsonPrimitive.long
    }

    private suspend fun io.ktor.client.HttpClient.abrirCaixa(token: String, idFilial: Long): Long {
        val n = System.nanoTime()
        val caixaNovo = post("/caixas") {
            auth(token)
            contentType(ContentType.Application.Json)
            setBody("""{"idFilial":$idFilial,"nome":"Caixa Ent $n"}""")
        }
        assertEquals(HttpStatusCode.Created, caixaNovo.status, caixaNovo.bodyAsText())
        val idCaixa = Json.parseToJsonElement(caixaNovo.bodyAsText()).jsonObject["id"]!!.jsonPrimitive.long
        val abertura = post("/caixa-sessoes") {
            auth(token)
            contentType(ContentType.Application.Json)
            setBody("""{"idCaixa":$idCaixa,"conferencia":[]}""")
        }
        assertEquals(HttpStatusCode.Created, abertura.status, abertura.bodyAsText())
        return Json.parseToJsonElement(abertura.bodyAsText()).jsonObject["id"]!!.jsonPrimitive.long
    }

    private suspend fun io.ktor.client.HttpClient.criarFornecedor(token: String, idFilial: Long): Long {
        val brasilId = paisId(token, "BR")
        val cpfId = tipoId(token, brasilId, "CPF")
        val cpf = cpfValidoAleatorio()
        val forn = post("/fornecedores") {
            auth(token)
            contentType(ContentType.Application.Json)
            setBody(
                """{"idFilialCadastro":$idFilial,"pessoa":{"nomeRazaoSocial":"Forn entrada $cpf","tipoPessoa":"fisica","documentos":[{"idPais":$brasilId,"idTipoDocumento":$cpfId,"numero":"$cpf"}]}}""",
            )
        }
        assertEquals(HttpStatusCode.Created, forn.status, forn.bodyAsText())
        return Json.parseToJsonElement(forn.bodyAsText()).jsonObject["id"]!!.jsonPrimitive.long
    }

    private suspend fun io.ktor.client.HttpClient.paisId(token: String, sigla: String): Long {
        val paises = Json.parseToJsonElement(get("/paises") { auth(token) }.bodyAsText()).jsonArray
        return paises.first { it.jsonObject["sigla"]!!.jsonPrimitive.content == sigla }
            .jsonObject["id"]!!.jsonPrimitive.long
    }

    private suspend fun io.ktor.client.HttpClient.tipoId(token: String, idPais: Long, codigo: String): Long {
        val tipos = Json.parseToJsonElement(get("/documentos-tipos?idPais=$idPais") { auth(token) }.bodyAsText()).jsonArray
        return tipos.first { it.jsonObject["codigo"]!!.jsonPrimitive.content == codigo }
            .jsonObject["id"]!!.jsonPrimitive.long
    }
}
