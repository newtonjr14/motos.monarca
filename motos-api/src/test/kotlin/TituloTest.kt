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
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.boolean
import kotlinx.serialization.json.double
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.long
import java.time.LocalDate
import java.time.ZoneId

class TituloTest {

    private val hoje = LocalDate.now(ZoneId.of("America/Asuncion")).toString()

    @Test
    fun `receber manual cliente e rejeita baixa com finalizador a prazo`() = testApplication {
        configure()
        withAuth { token ->
            val usdPyg = client.garantirCotacao(token)
            val idFilial = client.filialId(token)
            val idCliente = client.criarCliente(token, idFilial)
            val idFornecedor = client.criarFornecedor(token, idFilial)
            val fins = Json.parseToJsonElement(client.get("/finalizadores") { auth(token) }.bodyAsText()).jsonArray
            val idDinheiro = fins.first { it.jsonObject["nome"]!!.jsonPrimitive.content == "Dinheiro" }
                .jsonObject["id"]!!.jsonPrimitive.long
            val idCrediario = fins.firstOrNull {
                it.jsonObject["geraContasReceber"]?.jsonPrimitive?.boolean == true
            }?.jsonObject?.get("id")?.jsonPrimitive?.long ?: run {
                val criadoFin = client.post("/finalizadores") {
                    auth(token)
                    contentType(ContentType.Application.Json)
                    setBody("""{"nome":"Crediario Test","tipo":"outro","geraContasReceber":true}""")
                }
                assertEquals(HttpStatusCode.Created, criadoFin.status, criadoFin.bodyAsText())
                Json.parseToJsonElement(criadoFin.bodyAsText()).jsonObject["id"]!!.jsonPrimitive.long
            }

            val criado = client.post("/titulos-receber") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(
                    """{"idFilial":$idFilial,"idCliente":$idCliente,"moeda":"usd","valor":100,"parcelas":{"quantidade":2,"modoVencimento":"intervalo_30"}}""",
                )
            }
            assertEquals(HttpStatusCode.Created, criado.status, criado.bodyAsText())
            val titulo = Json.parseToJsonElement(criado.bodyAsText()).jsonObject
            assertEquals(2, titulo["parcelas"]!!.jsonArray.size)
            assertEquals(usdPyg * 100, titulo["valorPyg"]!!.jsonPrimitive.double, 1.0)
            val usdTravado = titulo["usdPyg"]!!.jsonPrimitive.double
            val idParcela = titulo["parcelas"]!!.jsonArray.first().jsonObject["id"]!!.jsonPrimitive.long

            val comCredito = client.post("/recebimentos") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(
                    """{"idParcela":$idParcela,"idFinalizador":$idCrediario,"moeda":"usd","valor":50}""",
                )
            }
            assertEquals(HttpStatusCode.BadRequest, comCredito.status)
            assertEquals(
                "FINALIZADOR_NAO_LIQUIDA",
                Json.parseToJsonElement(comCredito.bodyAsText()).jsonObject["codigo"]!!.jsonPrimitive.content,
            )

            val idSessao = client.abrirCaixa(token, idFilial)
            val baixa = client.post("/recebimentos") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(
                    """{"idParcela":$idParcela,"idFinalizador":$idDinheiro,"idCaixaSessao":$idSessao,"moeda":"usd","valor":50}""",
                )
            }
            assertEquals(HttpStatusCode.OK, baixa.status, baixa.bodyAsText())
            val depois = Json.parseToJsonElement(baixa.bodyAsText()).jsonObject
            assertEquals(usdTravado, depois["usdPyg"]!!.jsonPrimitive.double)
            assertEquals("parcial", depois["status"]!!.jsonPrimitive.content)
            val baixaLinha = depois["baixas"]!!.jsonArray.first().jsonObject
            assertEquals(50 * usdTravado, baixaLinha["valorPyg"]!!.jsonPrimitive.double, 1.0)

            val pagarFornecedor = client.post("/titulos-pagar") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(
                    """{"idFilial":$idFilial,"idFornecedor":$idFornecedor,"moeda":"pyg","valor":10000,"parcelas":{"quantidade":1,"modoVencimento":"intervalo_30"}}""",
                )
            }
            assertEquals(HttpStatusCode.Created, pagarFornecedor.status, pagarFornecedor.bodyAsText())
        }
    }

    @Test
    fun `baixa lote fifo quita primeira parcela e deixa saldo na segunda`() = testApplication {
        configure()
        withAuth { token ->
            client.garantirCotacao(token)
            val idFilial = client.filialId(token)
            val idCliente = client.criarCliente(token, idFilial)
            val idFornecedor = client.criarFornecedor(token, idFilial)
            val fins = Json.parseToJsonElement(client.get("/finalizadores") { auth(token) }.bodyAsText()).jsonArray
            val idDinheiro = fins.first { it.jsonObject["nome"]!!.jsonPrimitive.content == "Dinheiro" }
                .jsonObject["id"]!!.jsonPrimitive.long
            val idSessao = client.abrirCaixa(token, idFilial)

            val receber = client.post("/titulos-receber") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(
                    """{"idFilial":$idFilial,"idCliente":$idCliente,"moeda":"usd","valor":300,"parcelas":{"quantidade":2,"modoVencimento":"intervalo_30"}}""",
                )
            }
            assertEquals(HttpStatusCode.Created, receber.status, receber.bodyAsText())
            val tituloR = Json.parseToJsonElement(receber.bodyAsText()).jsonObject
            val parcelasR = tituloR["parcelas"]!!.jsonArray
            assertEquals(2, parcelasR.size)
            val idP1 = parcelasR[0].jsonObject["id"]!!.jsonPrimitive.long
            val idP2 = parcelasR[1].jsonObject["id"]!!.jsonPrimitive.long

            val baixaR = client.post("/recebimentos") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(
                    """{"idsParcelas":[$idP1,$idP2],"idFinalizador":$idDinheiro,"idCaixaSessao":$idSessao,"moeda":"usd","valor":200}""",
                )
            }
            assertEquals(HttpStatusCode.OK, baixaR.status, baixaR.bodyAsText())
            val depoisR = Json.parseToJsonElement(baixaR.bodyAsText()).jsonObject
            val psR = depoisR["parcelas"]!!.jsonArray.sortedBy { it.jsonObject["numero"]!!.jsonPrimitive.long }
            assertEquals("paga", psR[0].jsonObject["status"]!!.jsonPrimitive.content)
            assertEquals(0.0, psR[0].jsonObject["saldo"]!!.jsonPrimitive.double, 0.01)
            assertEquals("parcial", psR[1].jsonObject["status"]!!.jsonPrimitive.content)
            assertEquals(100.0, psR[1].jsonObject["saldo"]!!.jsonPrimitive.double, 0.01)
            assertEquals(2, depoisR["baixas"]!!.jsonArray.size)

            val pagar = client.post("/titulos-pagar") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(
                    """{"idFilial":$idFilial,"idFornecedor":$idFornecedor,"moeda":"usd","valor":300,"parcelas":{"quantidade":2,"modoVencimento":"intervalo_30"}}""",
                )
            }
            assertEquals(HttpStatusCode.Created, pagar.status, pagar.bodyAsText())
            val tituloP = Json.parseToJsonElement(pagar.bodyAsText()).jsonObject
            val parcelasP = tituloP["parcelas"]!!.jsonArray
            val idQ1 = parcelasP[0].jsonObject["id"]!!.jsonPrimitive.long
            val idQ2 = parcelasP[1].jsonObject["id"]!!.jsonPrimitive.long

            val baixaP = client.post("/pagamentos") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(
                    """{"idsParcelas":[$idQ1,$idQ2],"idFinalizador":$idDinheiro,"idCaixaSessao":$idSessao,"moeda":"usd","valor":200}""",
                )
            }
            assertEquals(HttpStatusCode.OK, baixaP.status, baixaP.bodyAsText())
            val depoisP = Json.parseToJsonElement(baixaP.bodyAsText()).jsonObject
            val psP = depoisP["parcelas"]!!.jsonArray.sortedBy { it.jsonObject["numero"]!!.jsonPrimitive.long }
            assertEquals("paga", psP[0].jsonObject["status"]!!.jsonPrimitive.content)
            assertEquals(100.0, psP[1].jsonObject["saldo"]!!.jsonPrimitive.double, 0.01)
        }
    }

    @Test
    fun `venda mista a vista e crediario gera titulo`() = testApplication {
        configure()
        withAuth { token ->
            client.garantirCotacao(token)
            val idFilial = client.filialId(token)
            val idEstoque = client.estoquePadrao(token, idFilial)
            val idSessao = client.abrirCaixa(token, idFilial)
            val idCliente = client.criarCliente(token, idFilial)
            val n = System.nanoTime()
            val (idMarca, idModelo) = criarModelo(token, "bicicleta", "Tit $n")
            val produto = client.post("/produtos") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(
                    """{"codigo":"TIT-$n","idMarca":$idMarca,"idModelo":$idModelo,"tipo":"bicicleta","precoLista":10000,"moedaPreco":"pyg","quantidadeInicial":5}""",
                )
            }
            assertEquals(HttpStatusCode.Created, produto.status, produto.bodyAsText())
            val idProduto = Json.parseToJsonElement(produto.bodyAsText()).jsonObject["id"]!!.jsonPrimitive.long
            val fins = Json.parseToJsonElement(client.get("/finalizadores") { auth(token) }.bodyAsText()).jsonArray
            val idDinheiro = fins.first { it.jsonObject["nome"]!!.jsonPrimitive.content == "Dinheiro" }
                .jsonObject["id"]!!.jsonPrimitive.long
            var idCrediario = fins.firstOrNull {
                it.jsonObject["geraContasReceber"]?.jsonPrimitive?.boolean == true
            }?.jsonObject?.get("id")?.jsonPrimitive?.long
            if (idCrediario == null) {
                val criadoFin = client.post("/finalizadores") {
                    auth(token)
                    contentType(ContentType.Application.Json)
                    setBody("""{"nome":"Crediario $n","tipo":"outro","geraContasReceber":true}""")
                }
                assertEquals(HttpStatusCode.Created, criadoFin.status, criadoFin.bodyAsText())
                idCrediario = Json.parseToJsonElement(criadoFin.bodyAsText()).jsonObject["id"]!!.jsonPrimitive.long
            }

            val venda = client.post("/vendas") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(
                    """{"idFilial":$idFilial,"idCliente":$idCliente,"idCaixaSessao":$idSessao,"itens":[{"idProduto":$idProduto,"idEstoque":$idEstoque,"quantidade":1}],"negociacao":[{"idFinalizador":$idDinheiro,"valor":4000},{"idFinalizador":$idCrediario,"valor":6000}],"parcelas":{"quantidade":3,"modoVencimento":"intervalo_30"}}""",
                )
            }
            assertEquals(HttpStatusCode.Created, venda.status, venda.bodyAsText())
            val idVenda = Json.parseToJsonElement(venda.bodyAsText()).jsonObject["id"]!!.jsonPrimitive.long
            val titulos = Json.parseToJsonElement(
                client.get("/titulos-receber?idFilial=$idFilial") { auth(token) }.bodyAsText(),
            ).jsonArray
            val titulo = titulos.first { it.jsonObject["idVenda"]?.jsonPrimitive?.long == idVenda }.jsonObject
            assertEquals(6000.0, titulo["valor"]!!.jsonPrimitive.double, 0.01)
            assertEquals(3, Json.parseToJsonElement(
                client.get("/titulos-receber/${titulo["id"]!!.jsonPrimitive.long}") { auth(token) }.bodyAsText(),
            ).jsonObject["parcelas"]!!.jsonArray.size)
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
            setBody("""{"idFilial":$idFilial,"nome":"Caixa Tit $n"}""")
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

    private suspend fun io.ktor.client.HttpClient.criarCliente(token: String, idFilial: Long): Long {
        val brasilId = paisId(token, "BR")
        val cpfId = tipoId(token, brasilId, "CPF")
        val cpf = cpfValidoAleatorio()
        val cliente = post("/clientes") {
            auth(token)
            contentType(ContentType.Application.Json)
            setBody(
                """{"idFilialCadastro":$idFilial,"pessoa":{"nomeRazaoSocial":"Cliente titulo $cpf","tipoPessoa":"fisica","documentos":[{"idPais":$brasilId,"idTipoDocumento":$cpfId,"numero":"$cpf"}]}}""",
            )
        }
        assertEquals(HttpStatusCode.Created, cliente.status, cliente.bodyAsText())
        return Json.parseToJsonElement(cliente.bodyAsText()).jsonObject["id"]!!.jsonPrimitive.long
    }

    private suspend fun io.ktor.client.HttpClient.criarFornecedor(token: String, idFilial: Long): Long {
        val brasilId = paisId(token, "BR")
        val cpfId = tipoId(token, brasilId, "CPF")
        val cpf = cpfValidoAleatorio()
        val forn = post("/fornecedores") {
            auth(token)
            contentType(ContentType.Application.Json)
            setBody(
                """{"idFilialCadastro":$idFilial,"pessoa":{"nomeRazaoSocial":"Fornecedor titulo $cpf","tipoPessoa":"fisica","documentos":[{"idPais":$brasilId,"idTipoDocumento":$cpfId,"numero":"$cpf"}]}}""",
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
