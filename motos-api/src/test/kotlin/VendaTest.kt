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
                val idCotacao = Json.parseToJsonElement(hojeRes.bodyAsText()).jsonObject["id"]!!.jsonPrimitive.long
                client.delete("/cotacoes/$idCotacao") { auth(token) }
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

            val caixas = Json.parseToJsonElement(client.get("/caixas") { auth(token) }.bodyAsText()).jsonArray
            val idFilial = caixas.first().jsonObject["idFilial"]!!.jsonPrimitive.long
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

            val estoques = Json.parseToJsonElement(client.get("/estoques") { auth(token) }.bodyAsText()).jsonArray
            val idEstoque = estoques.first().jsonObject["id"]!!.jsonPrimitive.long
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
                    """{"pessoa":{"nomeRazaoSocial":"Cliente $cpf","tipoPessoa":"fisica","documentos":[{"idPais":$brasilId,"idTipoDocumento":$cpfId,"numero":"$cpf"}]}}""",
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
