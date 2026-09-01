package com.monarca

import io.ktor.client.request.delete
import io.ktor.client.request.get
import io.ktor.client.request.post
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

class PapelFilialTest {

    @Test
    fun `cliente pode vincular segunda filial com confirmacao`() = testApplication {
        configure()
        withAuth { token ->
            val brasilId = client.paisId(token, "BR")
            val cpfId = client.tipoId(token, brasilId, "CPF")
            val cpf = cpfValidoAleatorio()
            val nome = "Filial Test $cpf"

            val criado = client.post("/clientes") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(papelBody(nome, brasilId, cpfId, cpf))
            }
            assertEquals(HttpStatusCode.Created, criado.status)
            val cliente = Json.parseToJsonElement(criado.bodyAsText()).jsonObject
            val idPessoa = cliente["idPessoa"]!!.jsonPrimitive.long
            val idFilialOrigem = cliente["idFilialCadastro"]!!.jsonPrimitive.long

            val empresaId = Json.parseToJsonElement(client.get("/empresas") { auth(token) }.bodyAsText())
                .jsonArray.first().jsonObject["id"]!!.jsonPrimitive.long
            val n = System.nanoTime()
            val filial2 = client.post("/filiais") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody("""{"idEmpresa":$empresaId,"nome":"Sucursal $n","principal":false}""")
            }
            assertEquals(HttpStatusCode.Created, filial2.status)
            val idFilial2 = Json.parseToJsonElement(filial2.bodyAsText()).jsonObject["id"]!!.jsonPrimitive.long

            val semConfirmar = client.post("/clientes") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody("""{"idPessoa":$idPessoa,"idFilialCadastro":$idFilial2}""")
            }
            assertEquals(HttpStatusCode.Conflict, semConfirmar.status)
            val conflito = Json.parseToJsonElement(semConfirmar.bodyAsText()).jsonObject
            assertEquals("VINCULO_FILIAL", conflito["codigo"]!!.jsonPrimitive.content)

            val comConfirmar = client.post("/clientes") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody("""{"idPessoa":$idPessoa,"idFilialCadastro":$idFilial2,"confirmarVinculoFilial":true}""")
            }
            assertEquals(HttpStatusCode.Created, comConfirmar.status)

            val listagem = Json.parseToJsonElement(
                client.get("/clientes?idFilial=$idFilial2") { auth(token) }.bodyAsText(),
            ).jsonArray
            assertTrue(listagem.any { it.jsonObject["idPessoa"]!!.jsonPrimitive.long == idPessoa })

            assertEquals(
                HttpStatusCode.NoContent,
                client.delete("/clientes/${cliente["id"]!!.jsonPrimitive.long}?idFilial=$idFilial2") { auth(token) }.status,
            )
            val aposDesvincular = Json.parseToJsonElement(
                client.get("/clientes?idFilial=$idFilial2") { auth(token) }.bodyAsText(),
            ).jsonArray
            assertTrue(aposDesvincular.none { it.jsonObject["idPessoa"]!!.jsonPrimitive.long == idPessoa })

            val aindaNaOrigem = Json.parseToJsonElement(
                client.get("/clientes?idFilial=$idFilialOrigem") { auth(token) }.bodyAsText(),
            ).jsonArray
            assertTrue(aindaNaOrigem.any { it.jsonObject["idPessoa"]!!.jsonPrimitive.long == idPessoa })
        }
    }

    private fun papelBody(nome: String, idPais: Long, idTipo: Long, numero: String) =
        """
        {
          "pessoa": {
            "nomeRazaoSocial":"$nome",
            "tipoPessoa":"fisica",
            "documentos":[{"idPais":$idPais,"idTipoDocumento":$idTipo,"numero":"$numero"}]
          }
        }
        """.trimIndent()

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
