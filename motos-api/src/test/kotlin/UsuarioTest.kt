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
import kotlin.test.assertFalse
import kotlin.test.assertNull
import kotlin.test.assertTrue
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.long

class UsuarioTest {

    @Test
    fun `usuario tem crud com soft delete`() = testApplication {
        configure()
        withAuth { token ->
            val n = System.nanoTime()
            val created = client.post("/usuarios") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(
                    """
                    {
                      "nome":"Ana Souza $n",
                      "login":"ana.$n",
                      "email":"ana.$n@exemplo.com",
                      "senha":"segredo12",
                      "perfil":"operador"
                    }
                    """.trimIndent(),
                )
            }
            assertEquals(HttpStatusCode.Created, created.status)
            val usuario = Json.parseToJsonElement(created.bodyAsText()).jsonObject
            val id = usuario["id"]!!.jsonPrimitive.long
            assertEquals("Ana Souza $n", usuario["nome"]!!.jsonPrimitive.content)
            assertEquals("ana.$n", usuario["login"]!!.jsonPrimitive.content)
            assertEquals("ana.$n@exemplo.com", usuario["email"]!!.jsonPrimitive.content)
            assertEquals("operador", usuario["perfil"]!!.jsonPrimitive.content)
            assertEquals("ativo", usuario["status"]!!.jsonPrimitive.content)
            assertNull(usuario["senha"])
            assertNull(usuario["senhaHash"])

            assertEquals(HttpStatusCode.OK, client.get("/usuarios/$id") { auth(token) }.status)

            val updated = client.put("/usuarios/$id") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(
                    """
                    {
                      "nome":"Ana Atualizada $n",
                      "login":"ana.$n",
                      "email":"ana.$n@exemplo.com",
                      "perfil":"gestor",
                      "status":"inativo"
                    }
                    """.trimIndent(),
                )
            }
            assertEquals(HttpStatusCode.OK, updated.status)
            val atualizado = Json.parseToJsonElement(updated.bodyAsText()).jsonObject
            assertEquals("Ana Atualizada $n", atualizado["nome"]!!.jsonPrimitive.content)
            assertEquals("gestor", atualizado["perfil"]!!.jsonPrimitive.content)
            assertEquals("inativo", atualizado["status"]!!.jsonPrimitive.content)

            val deletadoPut = client.put("/usuarios/$id") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(
                    """
                    {
                      "nome":"Ana Atualizada $n",
                      "login":"ana.$n",
                      "email":"ana.$n@exemplo.com",
                      "perfil":"gestor",
                      "status":"deletado"
                    }
                    """.trimIndent(),
                )
            }
            assertEquals(HttpStatusCode.BadRequest, deletadoPut.status)

            val deleted = client.delete("/usuarios/$id") { auth(token) }
            assertEquals(HttpStatusCode.NoContent, deleted.status)
            assertEquals(HttpStatusCode.NotFound, client.get("/usuarios/$id") { auth(token) }.status)
            val listados = Json.parseToJsonElement(client.get("/usuarios") { auth(token) }.bodyAsText()).jsonArray
            assertTrue(listados.none { it.jsonObject["id"]!!.jsonPrimitive.long == id })
        }
    }

    @Test
    fun `usuario aplica title case e email lowercase`() = testApplication {
        configure()
        withAuth { token ->
            val n = System.nanoTime()
            val created = client.post("/usuarios") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(
                    """
                    {
                      "nome":"  joão da SILVA  ",
                      "login":"joao.$n",
                      "email":"  Foo.Bar$n@Exemplo.COM ",
                      "senha":"segredo12",
                      "perfil":"administrador"
                    }
                    """.trimIndent(),
                )
            }
            assertEquals(HttpStatusCode.Created, created.status)
            val usuario = Json.parseToJsonElement(created.bodyAsText()).jsonObject
            assertEquals("João Da Silva", usuario["nome"]!!.jsonPrimitive.content)
            assertEquals("foo.bar$n@exemplo.com", usuario["email"]!!.jsonPrimitive.content)
        }
    }

    @Test
    fun `email duplicado e senha obrigatoria na criacao`() = testApplication {
        configure()
        withAuth { token ->
            val n = System.nanoTime()
            val email = "dup.$n@exemplo.com"
            val login = "dup.$n"
            val primeira = client.post("/usuarios") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(
                    """{"nome":"Um","login":"$login","email":"$email","senha":"segredo12","perfil":"operador"}""",
                )
            }
            assertEquals(HttpStatusCode.Created, primeira.status)

            val duplicada = client.post("/usuarios") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(
                    """{"nome":"Outro","login":"outro.$n","email":"$email","senha":"segredo12","perfil":"gestor"}""",
                )
            }
            assertEquals(HttpStatusCode.BadRequest, duplicada.status)
            assertTrue(duplicada.bodyAsText().contains("Já existe um usuário"))

            val semSenha = client.post("/usuarios") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(
                    """{"nome":"Sem Senha","login":"sem.$n","email":"sem.$n@exemplo.com","perfil":"operador"}""",
                )
            }
            assertEquals(HttpStatusCode.BadRequest, semSenha.status)
            assertTrue(semSenha.bodyAsText().contains("Senha é obrigatória"))
            assertFalse(semSenha.bodyAsText().contains("segredo"))
        }
    }

    @Test
    fun `system user nao pode ser editado ou excluido`() = testApplication {
        configure()
        withAuth { token ->
            val listados = Json.parseToJsonElement(client.get("/usuarios") { auth(token) }.bodyAsText()).jsonArray
            val system = listados.first { it.jsonObject["login"]!!.jsonPrimitive.content == "system" }
            val id = system.jsonObject["id"]!!.jsonPrimitive.long

            val edit = client.put("/usuarios/$id") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody(
                    """
                    {
                      "nome":"Hackeado",
                      "login":"system",
                      "email":"system@monarca.local",
                      "perfil":"administrador"
                    }
                    """.trimIndent(),
                )
            }
            assertEquals(HttpStatusCode.Forbidden, edit.status)

            val del = client.delete("/usuarios/$id") { auth(token) }
            assertEquals(HttpStatusCode.Forbidden, del.status)
        }
    }
}
