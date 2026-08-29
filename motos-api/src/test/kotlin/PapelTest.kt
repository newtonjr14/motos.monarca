package com.monarca

import io.ktor.client.HttpClient
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

class PapelTest {

    @Test
    fun `cliente e fornecedor compartilham a mesma pessoa`() = testApplication {
        configure()
        withAuth { token ->
            val brasilId = client.paisId(token, "BR")
            val cpfId = client.tipoId(token, brasilId, "CPF")
            val cpf = cpfValidoAleatorio()
            val nome = "Carlos $cpf"

            val criado = client.post("/clientes") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(papelBody(nome, brasilId, cpfId, cpf))
            }
            assertEquals(HttpStatusCode.Created, criado.status)
            val cliente = Json.parseToJsonElement(criado.bodyAsText()).jsonObject
            val idPessoa = cliente["idPessoa"]!!.jsonPrimitive.long
            assertEquals(nome, cliente["pessoa"]!!.jsonObject["nomeRazaoSocial"]!!.jsonPrimitive.content)

            val duplicado = client.post("/clientes") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(papelBody("Outro $nome", brasilId, cpfId, cpf))
            }
            assertEquals(HttpStatusCode.Conflict, duplicado.status)
            val conflito = Json.parseToJsonElement(duplicado.bodyAsText()).jsonObject
            assertEquals("DOCUMENTO_UNICO", conflito["codigo"]!!.jsonPrimitive.content)
            assertEquals(idPessoa, conflito["pessoa"]!!.jsonObject["id"]!!.jsonPrimitive.long)

            val mesmoCliente = client.post("/clientes") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody("""{"idPessoa":$idPessoa}""")
            }
            assertEquals(HttpStatusCode.BadRequest, mesmoCliente.status)

            val fornecedor = client.post("/fornecedores") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody("""{"idPessoa":$idPessoa}""")
            }
            assertEquals(HttpStatusCode.Created, fornecedor.status)
            assertEquals(idPessoa, Json.parseToJsonElement(fornecedor.bodyAsText()).jsonObject["idPessoa"]!!.jsonPrimitive.long)

            val clientes = Json.parseToJsonElement(client.get("/clientes") { auth(token) }.bodyAsText()).jsonArray
            assertTrue(clientes.any { it.jsonObject["idPessoa"]!!.jsonPrimitive.long == idPessoa })
        }
    }

    @Test
    fun `cliente tem soft delete`() = testApplication {
        configure()
        withAuth { token ->
            val brasilId = client.paisId(token, "BR")
            val cpfId = client.tipoId(token, brasilId, "CPF")
            val cpf = cpfValidoAleatorio()

            val criado = client.post("/clientes") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(papelBody("Ana $cpf", brasilId, cpfId, cpf))
            }
            assertEquals(HttpStatusCode.Created, criado.status)
            val id = Json.parseToJsonElement(criado.bodyAsText()).jsonObject["id"]!!.jsonPrimitive.long

            assertEquals(HttpStatusCode.NoContent, client.delete("/clientes/$id") { auth(token) }.status)
            assertEquals(HttpStatusCode.NotFound, client.get("/clientes/$id") { auth(token) }.status)
            val listados = Json.parseToJsonElement(client.get("/clientes") { auth(token) }.bodyAsText()).jsonArray
            assertTrue(listados.none { it.jsonObject["id"]!!.jsonPrimitive.long == id })
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
