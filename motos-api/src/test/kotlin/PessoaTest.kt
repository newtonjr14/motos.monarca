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
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.long

class PessoaTest {

    @Test
    fun `tipos de documento vem da semente`() = testApplication {
        configure()
        withAuth { token ->
            val brasilId = client.paisId(token, "BR")
            val tipos = Json.parseToJsonElement(
                client.get("/documentos-tipos?idPais=$brasilId&tipoPessoa=fisica") { auth(token) }.bodyAsText(),
            ).jsonArray
            val cpf = tipos.first { it.jsonObject["codigo"]!!.jsonPrimitive.content == "CPF" }.jsonObject
            assertEquals("fisica", cpf["tipoPessoa"]!!.jsonPrimitive.content)
            assertEquals(true, cpf["unico"]!!.jsonPrimitive.content.toBoolean())

            val todos = Json.parseToJsonElement(client.get("/documentos-tipos") { auth(token) }.bodyAsText()).jsonArray
            val codigos = todos.map { it.jsonObject["codigo"]!!.jsonPrimitive.content }.toSet()
            assertTrue(codigos.containsAll(listOf("CPF", "CNPJ", "CI", "RUC")))
        }
    }

    @Test
    fun `tipo de documento tem crud`() = testApplication {
        configure()
        withAuth { token ->
            val brasilId = client.paisId(token, "BR")
            val codigo = "TST${System.nanoTime() % 10000}"

            val created = client.post("/documentos-tipos") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(
                    """
                    {
                      "idPais":$brasilId,
                      "tipoPessoa":"fisica",
                      "codigo":"$codigo",
                      "nome":"Documento Teste",
                      "unico":true
                    }
                    """.trimIndent(),
                )
            }
            assertEquals(HttpStatusCode.Created, created.status)
            val tipo = Json.parseToJsonElement(created.bodyAsText()).jsonObject
            val id = tipo["id"]!!.jsonPrimitive.long

            assertEquals(HttpStatusCode.OK, client.get("/documentos-tipos/$id") { auth(token) }.status)

            val updated = client.put("/documentos-tipos/$id") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(
                    """
                    {
                      "idPais":$brasilId,
                      "tipoPessoa":"fisica",
                      "codigo":"$codigo",
                      "nome":"Documento Atualizado",
                      "unico":false
                    }
                    """.trimIndent(),
                )
            }
            assertEquals(HttpStatusCode.OK, updated.status)

            assertEquals(HttpStatusCode.NoContent, client.delete("/documentos-tipos/$id") { auth(token) }.status)
        }
    }

    @Test
    fun `cpf invalido retorna 400`() = testApplication {
        configure()
        withAuth { token ->
            val brasilId = client.paisId(token, "BR")
            val cpfId = client.tipoId(token, brasilId, "CPF")
            val res = client.post("/pessoas") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(
                    """
                    {
                      "nomeRazaoSocial":"Teste Invalido",
                      "tipoPessoa":"fisica",
                      "documentos":[{"idPais":$brasilId,"idTipoDocumento":$cpfId,"numero":"111.111.111-11"}]
                    }
                    """.trimIndent(),
                )
            }
            assertEquals(HttpStatusCode.BadRequest, res.status)
        }
    }

    @Test
    fun `pessoa tem crud com documento de catalogo`() = testApplication {
        configure()
        withAuth { token ->
            val brasilId = client.paisId(token, "BR")
            val cpfId = client.tipoId(token, brasilId, "CPF")
            val cpf = cpfValidoAleatorio()
            val nome = "João Silva ${System.nanoTime()}"

            val created = client.post("/pessoas") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(
                    """
                    {
                      "nomeRazaoSocial":"$nome",
                      "tipoPessoa":"fisica",
                      "documentos":[{"idPais":$brasilId,"idTipoDocumento":$cpfId,"numero":"$cpf"}]
                    }
                    """.trimIndent(),
                )
            }
            assertEquals(HttpStatusCode.Created, created.status)
            val pessoa = Json.parseToJsonElement(created.bodyAsText()).jsonObject
            val id = pessoa["id"]!!.jsonPrimitive.long
            assertEquals(nome, pessoa["nomeRazaoSocial"]!!.jsonPrimitive.content)
            assertEquals("ativo", pessoa["status"]!!.jsonPrimitive.content)
            assertEquals(cpf, pessoa["documentos"]!!.jsonArray[0].jsonObject["numero"]!!.jsonPrimitive.content)

            assertEquals(HttpStatusCode.OK, client.get("/pessoas/$id") { auth(token) }.status)

            val updated = client.put("/pessoas/$id") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(
                    """
                    {
                      "nomeRazaoSocial":"João Atualizado",
                      "tipoPessoa":"fisica",
                      "status":"inativo",
                      "documentos":[{"idPais":$brasilId,"idTipoDocumento":$cpfId,"numero":"$cpf"}]
                    }
                    """.trimIndent(),
                )
            }
            assertEquals(HttpStatusCode.OK, updated.status)
            val atualizado = Json.parseToJsonElement(updated.bodyAsText()).jsonObject
            assertEquals("João Atualizado", atualizado["nomeRazaoSocial"]!!.jsonPrimitive.content)
            assertEquals("inativo", atualizado["status"]!!.jsonPrimitive.content)

            val deletadoPut = client.put("/pessoas/$id") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(
                    """
                    {
                      "nomeRazaoSocial":"João Atualizado",
                      "tipoPessoa":"fisica",
                      "status":"deletado",
                      "documentos":[{"idPais":$brasilId,"idTipoDocumento":$cpfId,"numero":"$cpf"}]
                    }
                    """.trimIndent(),
                )
            }
            assertEquals(HttpStatusCode.BadRequest, deletadoPut.status)

            val deleted = client.delete("/pessoas/$id") { auth(token) }
            assertEquals(HttpStatusCode.NoContent, deleted.status)
            assertEquals(HttpStatusCode.NotFound, client.get("/pessoas/$id") { auth(token) }.status)
            val listados = Json.parseToJsonElement(client.get("/pessoas") { auth(token) }.bodyAsText()).jsonArray
            assertTrue(listados.none { it.jsonObject["id"]!!.jsonPrimitive.long == id })
        }
    }

    @Test
    fun `cpf duplicado retorna 409 sem perguntar se e a mesma pessoa`() = testApplication {
        configure()
        withAuth { token ->
            val brasilId = client.paisId(token, "BR")
            val cpfId = client.tipoId(token, brasilId, "CPF")
            val cpf = cpfValidoAleatorio()

            val primeira = client.post("/pessoas") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(
                    """
                    {
                      "nomeRazaoSocial":"Maria $cpf",
                      "tipoPessoa":"fisica",
                      "documentos":[{"idPais":$brasilId,"idTipoDocumento":$cpfId,"numero":"$cpf"}]
                    }
                    """.trimIndent(),
                )
            }
            assertEquals(HttpStatusCode.Created, primeira.status)
            val id = Json.parseToJsonElement(primeira.bodyAsText()).jsonObject["id"]!!.jsonPrimitive.long

            val duplicada = client.post("/pessoas") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(
                    """
                    {
                      "nomeRazaoSocial":"Outra Maria",
                      "tipoPessoa":"fisica",
                      "documentos":[{"idPais":$brasilId,"idTipoDocumento":$cpfId,"numero":"$cpf"}]
                    }
                    """.trimIndent(),
                )
            }
            assertEquals(HttpStatusCode.Conflict, duplicada.status)
            val conflito = Json.parseToJsonElement(duplicada.bodyAsText()).jsonObject
            assertEquals("DOCUMENTO_UNICO", conflito["codigo"]!!.jsonPrimitive.content)
            assertEquals(id, conflito["pessoa"]!!.jsonObject["id"]!!.jsonPrimitive.long)
        }
    }

    @Test
    fun `documento livre avisa e permite confirmar nova pessoa`() = testApplication {
        configure()
        withAuth { token ->
            val n = System.nanoTime()
            val sigla = "${'A' + ((n / 26) % 26).toInt()}${'A' + (n % 26).toInt()}"
            val pais = client.post("/paises") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody("""{"nome":"Teste $sigla","sigla":"$sigla","usaSiglaDivisao":false}""")
            }
            assertEquals(HttpStatusCode.Created, pais.status)
            val idPais = Json.parseToJsonElement(pais.bodyAsText()).jsonObject["id"]!!.jsonPrimitive.long
            val numero = "AB$n"

            val primeira = client.post("/pessoas") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(
                    """
                    {
                      "nomeRazaoSocial":"Ana $n",
                      "tipoPessoa":"fisica",
                      "documentos":[{"idPais":$idPais,"tipoLivre":"passaporte","numero":"$numero"}]
                    }
                    """.trimIndent(),
                )
            }
            assertEquals(HttpStatusCode.Created, primeira.status)
            val id = Json.parseToJsonElement(primeira.bodyAsText()).jsonObject["id"]!!.jsonPrimitive.long

            val aviso = client.post("/pessoas") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(
                    """
                    {
                      "nomeRazaoSocial":"Outra Ana",
                      "tipoPessoa":"fisica",
                      "documentos":[{"idPais":$idPais,"tipoLivre":"PASSAPORTE","numero":"$numero"}]
                    }
                    """.trimIndent(),
                )
            }
            assertEquals(HttpStatusCode.Conflict, aviso.status)
            val conflito = Json.parseToJsonElement(aviso.bodyAsText()).jsonObject
            assertEquals("DOCUMENTO_POSSIVEL_DUPLICADO", conflito["codigo"]!!.jsonPrimitive.content)
            assertEquals(id, conflito["pessoa"]!!.jsonObject["id"]!!.jsonPrimitive.long)

            val confirmada = client.post("/pessoas") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(
                    """
                    {
                      "nomeRazaoSocial":"Outra Ana",
                      "tipoPessoa":"fisica",
                      "confirmarNovaPessoa":true,
                      "documentos":[{"idPais":$idPais,"tipoLivre":"PASSAPORTE","numero":"$numero"}]
                    }
                    """.trimIndent(),
                )
            }
            assertEquals(HttpStatusCode.Created, confirmada.status)
            val outraId = Json.parseToJsonElement(confirmada.bodyAsText()).jsonObject["id"]!!.jsonPrimitive.long
            assertTrue(outraId != id)
        }
    }

    @Test
    fun `pessoa aplica title case e email lowercase`() = testApplication {
        configure()
        withAuth { token ->
            val brasilId = client.paisId(token, "BR")
            val cpfId = client.tipoId(token, brasilId, "CPF")
            val cpf = cpfValidoAleatorio()

            val created = client.post("/pessoas") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(
                    """
                    {
                      "nomeRazaoSocial":"  joão da SILVA  ",
                      "tipoPessoa":"fisica",
                      "email":"  Foo.Bar@Exemplo.COM ",
                      "tipoLogradouro":"rua",
                      "logradouro":"avenida brasil",
                      "bairro":"centro norte",
                      "complemento":"casa dois",
                      "documentos":[{"idPais":$brasilId,"idTipoDocumento":$cpfId,"numero":"$cpf"}]
                    }
                    """.trimIndent(),
                )
            }
            assertEquals(HttpStatusCode.Created, created.status)
            val pessoa = Json.parseToJsonElement(created.bodyAsText()).jsonObject
            assertEquals("João Da Silva", pessoa["nomeRazaoSocial"]!!.jsonPrimitive.content)
            assertEquals("foo.bar@exemplo.com", pessoa["email"]!!.jsonPrimitive.content)
            assertEquals("Rua", pessoa["tipoLogradouro"]!!.jsonPrimitive.content)
            assertEquals("Avenida Brasil", pessoa["logradouro"]!!.jsonPrimitive.content)
            assertEquals("Centro Norte", pessoa["bairro"]!!.jsonPrimitive.content)
            assertEquals("Casa Dois", pessoa["complemento"]!!.jsonPrimitive.content)
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
