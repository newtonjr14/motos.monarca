package com.monarca

import io.ktor.client.HttpClient
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
import kotlinx.serialization.json.double
import kotlinx.serialization.json.int
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.long

class VendaTest {

    private val hoje = LocalDate.now(ZoneId.of("America/Asuncion")).toString()

    @Test
    fun `venda exige cotacao caixa aberto estoque e negociacao`() = testApplication {
        configure()
        withAuth { token ->
            val hojeRes = client.get("/cotacoes/hoje") { auth(token) }
            if (hojeRes.status == HttpStatusCode.OK) {
                val atual = Json.parseToJsonElement(hojeRes.bodyAsText()).jsonObject
                val idCotacao = atual["id"]!!.jsonPrimitive.long
                client.put("/cotacoes/$idCotacao") {
                    auth(token)
                    contentType(ContentType.Application.Json)
                    setBody(
                        """{"data":"$hoje","usdPyg":${atual["usdPyg"]},"brlPyg":${atual["brlPyg"]},"status":"inativo"}""",
                    )
                }
            }
            val semCotacao = client.post("/vendas") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody("""{"idCliente":1,"itens":[{"idProduto":1,"quantidade":1}],"negociacao":[{"idFinalizador":1,"valor":1}]}""")
            }
            assertEquals(HttpStatusCode.Forbidden, semCotacao.status)
            assertEquals(
                "COTACAO_DIA_AUSENTE",
                Json.parseToJsonElement(semCotacao.bodyAsText()).jsonObject["codigo"]!!.jsonPrimitive.content,
            )

            val filialJson = Json.parseToJsonElement(client.get("/filiais/principal") { auth(token) }.bodyAsText()).jsonObject
            val idFilial = filialJson["id"]!!.jsonPrimitive.long
            val nCaixa = System.nanoTime()
            val caixaNovo = client.post("/caixas") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody("""{"idFilial":$idFilial,"nome":"Caixa Venda $nCaixa"}""")
            }
            assertEquals(HttpStatusCode.Created, caixaNovo.status, caixaNovo.bodyAsText())
            val idCaixa = Json.parseToJsonElement(caixaNovo.bodyAsText()).jsonObject["id"]!!.jsonPrimitive.long
            val abertura = client.post("/caixa-sessoes") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody("""{"idCaixa":$idCaixa,"conferencia":[]}""")
            }
            assertEquals(HttpStatusCode.Created, abertura.status, abertura.bodyAsText())
            val idSessao = Json.parseToJsonElement(abertura.bodyAsText()).jsonObject["id"]!!.jsonPrimitive.long

            val cotacao = client.post("/cotacoes") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody("""{"data":"$hoje","usdPyg":7300,"brlPyg":1400}""")
            }
            assertEquals(HttpStatusCode.Created, cotacao.status, cotacao.bodyAsText())

            val putFilial = client.put("/filiais/$idFilial") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(
                    """{"idEmpresa":${filialJson["idEmpresa"]!!.jsonPrimitive.long},"nome":${filialJson["nome"]},"moedaOperacao":"pyg","principal":${filialJson["principal"]}}""",
                )
            }
            assertEquals(HttpStatusCode.OK, putFilial.status, putFilial.bodyAsText())
            val idEstoque = Json.parseToJsonElement(putFilial.bodyAsText()).jsonObject["idEstoquePadrao"]!!.jsonPrimitive.long

            val n = System.nanoTime()
            val (idMarca, idModelo) = criarModelo(token, "bicicleta", "Venda $n")
            val produto = client.post("/produtos") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(
                    """{"codigo":"VD-$n","idMarca":$idMarca,"idModelo":$idModelo,"tipo":"bicicleta","precoLista":10000,"moedaPreco":"pyg"}""",
                )
            }
            assertEquals(HttpStatusCode.Created, produto.status, produto.bodyAsText())
            val idProduto = Json.parseToJsonElement(produto.bodyAsText()).jsonObject["id"]!!.jsonPrimitive.long

            val estoques = Json.parseToJsonElement(
                client.get("/estoques?idFilial=$idFilial") { auth(token) }.bodyAsText(),
            ).jsonArray
            assertTrue(estoques.any { it.jsonObject["id"]!!.jsonPrimitive.long == idEstoque })
            val itensEstoque = Json.parseToJsonElement(
                client.get("/estoque-produtos?idEstoque=$idEstoque") { auth(token) }.bodyAsText(),
            ).jsonArray
            val idItem = itensEstoque.first { it.jsonObject["idProduto"]!!.jsonPrimitive.long == idProduto }
                .jsonObject["id"]!!.jsonPrimitive.long
            val stock = client.put("/estoque-produtos/$idItem") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody("""{"idEstoque":$idEstoque,"idProduto":$idProduto,"quantidade":5,"quantidadeReservada":0}""")
            }
            assertEquals(HttpStatusCode.OK, stock.status, stock.bodyAsText())

            val brasilId = client.paisId(token, "BR")
            val cpfId = client.tipoId(token, brasilId, "CPF")
            val cpf = cpfValidoAleatorio()
            val cliente = client.post("/clientes") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(
                    """{"idFilialCadastro":$idFilial,"pessoa":{"nomeRazaoSocial":"Cliente $cpf","tipoPessoa":"fisica","documentos":[{"idPais":$brasilId,"idTipoDocumento":$cpfId,"numero":"$cpf"}]}}""",
                )
            }
            assertEquals(HttpStatusCode.Created, cliente.status, cliente.bodyAsText())
            val idCliente = Json.parseToJsonElement(cliente.bodyAsText()).jsonObject["id"]!!.jsonPrimitive.long

            val fins = Json.parseToJsonElement(client.get("/finalizadores") { auth(token) }.bodyAsText()).jsonArray
            val idDinheiro = fins.first { it.jsonObject["nome"]!!.jsonPrimitive.content == "Dinheiro" }
                .jsonObject["id"]!!.jsonPrimitive.long
            val idCartao = fins.first { it.jsonObject["nome"]!!.jsonPrimitive.content == "Cartão" }
                .jsonObject["id"]!!.jsonPrimitive.long

            val divergente = client.post("/vendas") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(
                    """{"idFilial":$idFilial,"idCliente":$idCliente,"idCaixaSessao":$idSessao,"itens":[{"idProduto":$idProduto,"idEstoque":$idEstoque,"quantidade":1}],"negociacao":[{"idFinalizador":$idDinheiro,"valor":1}]}""",
                )
            }
            assertEquals(HttpStatusCode.BadRequest, divergente.status)
            assertEquals(
                "VENDA_NEGOCIACAO_DIVERGENTE",
                Json.parseToJsonElement(divergente.bodyAsText()).jsonObject["codigo"]!!.jsonPrimitive.content,
            )

            val venda = client.post("/vendas") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(
                    """{"idFilial":$idFilial,"idCliente":$idCliente,"idCaixaSessao":$idSessao,"itens":[{"idProduto":$idProduto,"idEstoque":$idEstoque,"quantidade":2}],"negociacao":[{"idFinalizador":$idDinheiro,"valor":12000},{"idFinalizador":$idCartao,"valor":8000}]}""",
                )
            }
            assertEquals(HttpStatusCode.Created, venda.status, venda.bodyAsText())
            val body = Json.parseToJsonElement(venda.bodyAsText()).jsonObject
            assertEquals(20000.0, body["totalPyg"]!!.jsonPrimitive.double)
            assertEquals(1, body["itens"]!!.jsonArray.size)
            assertEquals(2, body["itens"]!!.jsonArray.first().jsonObject["quantidade"]!!.jsonPrimitive.int)
            assertEquals(2, body["negociacao"]!!.jsonArray.size)

            val ficha = Json.parseToJsonElement(
                client.get("/produtos/$idProduto?idFilial=$idFilial") { auth(token) }.bodyAsText(),
            ).jsonObject
            assertEquals(3, ficha["quantidadeDisponivel"]!!.jsonPrimitive.int)

            val sessao = Json.parseToJsonElement(client.get("/caixa-sessoes/$idSessao") { auth(token) }.bodyAsText()).jsonObject
            val saldoDinheiro = sessao["saldos"]!!.jsonArray.first {
                it.jsonObject["idFinalizador"]!!.jsonPrimitive.long == idDinheiro
            }
            assertEquals(12000.0, saldoDinheiro.jsonObject["valor"]!!.jsonPrimitive.double)

            val lista = Json.parseToJsonElement(client.get("/vendas?idFilial=$idFilial") { auth(token) }.bodyAsText()).jsonArray
            assertTrue(lista.any { it.jsonObject["id"]!!.jsonPrimitive.long == body["id"]!!.jsonPrimitive.long })

            val me = Json.parseToJsonElement(client.get("/auth/me") { auth(token) }.bodyAsText()).jsonObject
            val idSystem = me["id"]!!.jsonPrimitive.long
            assertEquals(idSystem, body["idVendedor"]!!.jsonPrimitive.long)

            val vendedores = Json.parseToJsonElement(
                client.get("/vendas/vendedores?idFilial=$idFilial") { auth(token) }.bodyAsText(),
            ).jsonArray
            assertTrue(vendedores.none { it.jsonObject["id"]!!.jsonPrimitive.long == idSystem })

            val nVend = System.nanoTime()
            val outro = client.post("/usuarios") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(
                    """{"nome":"Vendedor PDV $nVend","login":"vend.$nVend","email":"vend.$nVend@exemplo.com","senha":"segredo12","perfil":"vendedor","idsFiliais":[$idFilial]}""",
                )
            }
            assertEquals(HttpStatusCode.Created, outro.status, outro.bodyAsText())
            val outroBody = Json.parseToJsonElement(outro.bodyAsText()).jsonObject
            val idOutro = outroBody["id"]!!.jsonPrimitive.long
            val nomeOutro = outroBody["nome"]!!.jsonPrimitive.content

            val listaApos = Json.parseToJsonElement(
                client.get("/vendas/vendedores?idFilial=$idFilial") { auth(token) }.bodyAsText(),
            ).jsonArray
            assertTrue(listaApos.any { it.jsonObject["id"]!!.jsonPrimitive.long == idOutro })

            val vendaOutro = client.post("/vendas") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(
                    """{"idFilial":$idFilial,"idCliente":$idCliente,"idVendedor":$idOutro,"idCaixaSessao":$idSessao,"itens":[{"idProduto":$idProduto,"idEstoque":$idEstoque,"quantidade":1}],"negociacao":[{"idFinalizador":$idDinheiro,"valor":10000}]}""",
                )
            }
            assertEquals(HttpStatusCode.Created, vendaOutro.status, vendaOutro.bodyAsText())
            val bodyOutro = Json.parseToJsonElement(vendaOutro.bodyAsText()).jsonObject
            assertEquals(idOutro, bodyOutro["idVendedor"]!!.jsonPrimitive.long)
            assertEquals(nomeOutro, bodyOutro["vendedorNome"]!!.jsonPrimitive.content)

            val vendaUsd = client.post("/vendas") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(
                    """{"idFilial":$idFilial,"idCliente":$idCliente,"idCaixaSessao":$idSessao,"itens":[{"idProduto":$idProduto,"idEstoque":$idEstoque,"quantidade":1}],"negociacao":[{"idFinalizador":$idDinheiro,"moeda":"usd","valor":1},{"idFinalizador":$idDinheiro,"moeda":"pyg","valor":2700}]}""",
                )
            }
            assertEquals(HttpStatusCode.Created, vendaUsd.status, vendaUsd.bodyAsText())
            val bodyUsd = Json.parseToJsonElement(vendaUsd.bodyAsText()).jsonObject
            assertEquals(10000.0, bodyUsd["totalPyg"]!!.jsonPrimitive.double)
            val negUsd = bodyUsd["negociacao"]!!.jsonArray
            assertEquals(2, negUsd.size)
            val linhaUsd = negUsd.first { it.jsonObject["moeda"]!!.jsonPrimitive.content == "usd" }.jsonObject
            assertEquals(1.0, linhaUsd["valor"]!!.jsonPrimitive.double)
            assertEquals(7300.0, linhaUsd["valorPyg"]!!.jsonPrimitive.double)
            val linhaPyg = negUsd.first { it.jsonObject["moeda"]!!.jsonPrimitive.content == "pyg" }.jsonObject
            assertEquals(2700.0, linhaPyg["valorPyg"]!!.jsonPrimitive.double)

            val sessaoApos = Json.parseToJsonElement(client.get("/caixa-sessoes/$idSessao") { auth(token) }.bodyAsText()).jsonObject
            val saldosApos = sessaoApos["saldos"]!!.jsonArray
            assertTrue(saldosApos.any {
                it.jsonObject["idFinalizador"]!!.jsonPrimitive.long == idDinheiro &&
                    it.jsonObject["moeda"]!!.jsonPrimitive.content == "usd" &&
                    it.jsonObject["valor"]!!.jsonPrimitive.double == 1.0
            })
        }
    }

    @Test
    fun `venda de moto exige chassi e marca unidade vendida`() = testApplication {
        configure()
        withAuth { token ->
            val hojeRes = client.get("/cotacoes/hoje") { auth(token) }
            if (hojeRes.status != HttpStatusCode.OK) {
                val cotacao = client.post("/cotacoes") {
                    auth(token)
                    contentType(ContentType.Application.Json)
                    setBody("""{"data":"$hoje","usdPyg":7300,"brlPyg":1400}""")
                }
                assertEquals(HttpStatusCode.Created, cotacao.status, cotacao.bodyAsText())
            }

            val filialJson = Json.parseToJsonElement(client.get("/filiais/principal") { auth(token) }.bodyAsText()).jsonObject
            val idFilial = filialJson["id"]!!.jsonPrimitive.long
            val putFilial = client.put("/filiais/$idFilial") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(
                    """{"idEmpresa":${filialJson["idEmpresa"]!!.jsonPrimitive.long},"nome":${filialJson["nome"]},"moedaOperacao":"pyg","principal":${filialJson["principal"]}}""",
                )
            }
            assertEquals(HttpStatusCode.OK, putFilial.status, putFilial.bodyAsText())
            val idEstoque = Json.parseToJsonElement(putFilial.bodyAsText()).jsonObject["idEstoquePadrao"]!!.jsonPrimitive.long

            val nCaixa = System.nanoTime()
            val caixaNovo = client.post("/caixas") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody("""{"idFilial":$idFilial,"nome":"Caixa Moto $nCaixa"}""")
            }
            assertEquals(HttpStatusCode.Created, caixaNovo.status, caixaNovo.bodyAsText())
            val idCaixa = Json.parseToJsonElement(caixaNovo.bodyAsText()).jsonObject["id"]!!.jsonPrimitive.long
            val abertura = client.post("/caixa-sessoes") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody("""{"idCaixa":$idCaixa,"conferencia":[]}""")
            }
            assertEquals(HttpStatusCode.Created, abertura.status, abertura.bodyAsText())
            val idSessao = Json.parseToJsonElement(abertura.bodyAsText()).jsonObject["id"]!!.jsonPrimitive.long

            val n = System.nanoTime()
            val (idMarca, idModelo) = criarModelo(token, "moto", "Venda Moto $n")
            val produto = client.post("/produtos") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(
                    """{"codigo":"VM-$n","idMarca":$idMarca,"idModelo":$idModelo,"tipo":"moto","precoLista":10000,"moedaPreco":"pyg","moto":{"anoFabricacao":2026,"anoModelo":2026},"numerosIniciais":["CHV${n}A","CHV${n}B"]}""",
                )
            }
            assertEquals(HttpStatusCode.Created, produto.status, produto.bodyAsText())
            val idProduto = Json.parseToJsonElement(produto.bodyAsText()).jsonObject["id"]!!.jsonPrimitive.long
            assertEquals(2, Json.parseToJsonElement(produto.bodyAsText()).jsonObject["quantidadeDisponivel"]!!.jsonPrimitive.int)

            val brasilId = client.paisId(token, "BR")
            val cpfId = client.tipoId(token, brasilId, "CPF")
            val cpf = cpfValidoAleatorio()
            val cliente = client.post("/clientes") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(
                    """{"idFilialCadastro":$idFilial,"pessoa":{"nomeRazaoSocial":"Cliente moto $cpf","tipoPessoa":"fisica","documentos":[{"idPais":$brasilId,"idTipoDocumento":$cpfId,"numero":"$cpf"}]}}""",
                )
            }
            assertEquals(HttpStatusCode.Created, cliente.status, cliente.bodyAsText())
            val idCliente = Json.parseToJsonElement(cliente.bodyAsText()).jsonObject["id"]!!.jsonPrimitive.long

            val fins = Json.parseToJsonElement(client.get("/finalizadores") { auth(token) }.bodyAsText()).jsonArray
            val idDinheiro = fins.first { it.jsonObject["nome"]!!.jsonPrimitive.content == "Dinheiro" }
                .jsonObject["id"]!!.jsonPrimitive.long

            val semChassi = client.post("/vendas") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(
                    """{"idFilial":$idFilial,"idCliente":$idCliente,"idCaixaSessao":$idSessao,"itens":[{"idProduto":$idProduto,"idEstoque":$idEstoque,"quantidade":1}],"negociacao":[{"idFinalizador":$idDinheiro,"valor":10000}]}""",
                )
            }
            assertEquals(HttpStatusCode.BadRequest, semChassi.status)
            assertEquals(
                "UNIDADE_OBRIGATORIA",
                Json.parseToJsonElement(semChassi.bodyAsText()).jsonObject["codigo"]!!.jsonPrimitive.content,
            )

            val unidades = Json.parseToJsonElement(client.get("/produtos/$idProduto/unidades") { auth(token) }.bodyAsText()).jsonArray
            val idUnidade = unidades.first().jsonObject["id"]!!.jsonPrimitive.long
            val numero = unidades.first().jsonObject["numero"]!!.jsonPrimitive.content

            val venda = client.post("/vendas") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(
                    """{"idFilial":$idFilial,"idCliente":$idCliente,"idCaixaSessao":$idSessao,"itens":[{"idProduto":$idProduto,"idEstoque":$idEstoque,"quantidade":1,"idsUnidades":[$idUnidade]}],"negociacao":[{"idFinalizador":$idDinheiro,"valor":10000}]}""",
                )
            }
            assertEquals(HttpStatusCode.Created, venda.status, venda.bodyAsText())
            val itemVenda = Json.parseToJsonElement(venda.bodyAsText()).jsonObject["itens"]!!.jsonArray.first().jsonObject
            assertEquals(numero, itemVenda["chassis"]!!.jsonArray.first().jsonPrimitive.content)

            val depois = Json.parseToJsonElement(client.get("/produtos/$idProduto/unidades") { auth(token) }.bodyAsText()).jsonArray
            val vendida = depois.first { it.jsonObject["id"]!!.jsonPrimitive.long == idUnidade }.jsonObject
            assertEquals("vendido", vendida["situacao"]!!.jsonPrimitive.content)
            val ficha = Json.parseToJsonElement(
                client.get("/produtos/$idProduto?idFilial=$idFilial") { auth(token) }.bodyAsText(),
            ).jsonObject
            assertEquals(1, ficha["quantidadeDisponivel"]!!.jsonPrimitive.int)

            val excluir = client.delete("/produtos/$idProduto/unidades/$idUnidade") { auth(token) }
            assertEquals(HttpStatusCode.BadRequest, excluir.status)
            assertEquals(
                "UNIDADE_VENDIDA",
                Json.parseToJsonElement(excluir.bodyAsText()).jsonObject["codigo"]!!.jsonPrimitive.content,
            )
        }
    }

    private suspend fun HttpClient.paisId(token: String, sigla: String): Long {
        val paises = Json.parseToJsonElement(get("/paises") { auth(token) }.bodyAsText()).jsonArray
        return paises.first { it.jsonObject["sigla"]!!.jsonPrimitive.content == sigla }
            .jsonObject["id"]!!.jsonPrimitive.long
    }

    private suspend fun HttpClient.tipoId(token: String, idPais: Long, codigo: String): Long {
        val tipos = Json.parseToJsonElement(get("/documentos-tipos?idPais=$idPais") { auth(token) }.bodyAsText()).jsonArray
        return tipos.first { it.jsonObject["codigo"]!!.jsonPrimitive.content == codigo }
            .jsonObject["id"]!!.jsonPrimitive.long
    }
}
