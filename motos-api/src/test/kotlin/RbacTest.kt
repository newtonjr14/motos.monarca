package com.monarca

import com.monarca.auth.domain.Permissao
import com.monarca.auth.domain.Rbac
import com.monarca.usuario.domain.PerfilUsuario
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
import kotlin.test.assertFalse
import kotlin.test.assertTrue
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.long

class RbacTest {

    @Test
    fun `matriz de perfil bate com o combinado`() {
        assertTrue(Rbac.possui(PerfilUsuario.ADMINISTRADOR, Permissao.CONFIGURACAO))
        assertTrue(Rbac.possui(PerfilUsuario.ADMINISTRADOR, Permissao.DOCUMENTO_GERENCIAR))
        assertTrue(Rbac.possui(PerfilUsuario.ADMINISTRADOR, Permissao.DASHBOARD_CONSULTAR))

        assertFalse(Rbac.possui(PerfilUsuario.GESTOR, Permissao.CONFIGURACAO))
        assertTrue(Rbac.possui(PerfilUsuario.GESTOR, Permissao.USUARIO_LISTAR))
        assertTrue(Rbac.possui(PerfilUsuario.GESTOR, Permissao.DOCUMENTO_GERENCIAR))
        assertTrue(Rbac.possui(PerfilUsuario.GESTOR, Permissao.PESSOA_GERENCIAR))
        assertTrue(Rbac.possui(PerfilUsuario.GESTOR, Permissao.VENDA_REGISTRAR))
        assertTrue(Rbac.possui(PerfilUsuario.GESTOR, Permissao.DASHBOARD_CONSULTAR))

        assertFalse(Rbac.possui(PerfilUsuario.OPERADOR, Permissao.CONFIGURACAO))
        assertFalse(Rbac.possui(PerfilUsuario.OPERADOR, Permissao.USUARIO_LISTAR))
        assertFalse(Rbac.possui(PerfilUsuario.OPERADOR, Permissao.LOCALIDADE_GERENCIAR))
        assertFalse(Rbac.possui(PerfilUsuario.OPERADOR, Permissao.DOCUMENTO_GERENCIAR))
        assertFalse(Rbac.possui(PerfilUsuario.OPERADOR, Permissao.DASHBOARD_CONSULTAR))
        assertTrue(Rbac.possui(PerfilUsuario.OPERADOR, Permissao.PESSOA_GERENCIAR))
        assertTrue(Rbac.possui(PerfilUsuario.OPERADOR, Permissao.VENDA_REGISTRAR))
        assertTrue(Rbac.possui(PerfilUsuario.OPERADOR, Permissao.PRODUTO_GERENCIAR))
        assertTrue(Rbac.possui(PerfilUsuario.OPERADOR, Permissao.ESTOQUE_GERENCIAR))

        assertFalse(Rbac.possui(PerfilUsuario.VENDEDOR, Permissao.PESSOA_GERENCIAR))
        assertFalse(Rbac.possui(PerfilUsuario.VENDEDOR, Permissao.DASHBOARD_CONSULTAR))
        assertTrue(Rbac.possui(PerfilUsuario.VENDEDOR, Permissao.VENDA_REGISTRAR))
        assertTrue(Rbac.possui(PerfilUsuario.VENDEDOR, Permissao.PESSOA_CONSULTAR))
    }

    @Test
    fun `rotas respeitam perfil`() = testApplication {
        configure()
        withAuth { admin ->
            val gestor = criarELogar(admin, "gestor")
            val operador = criarELogar(admin, "operador")
            val vendedor = criarELogar(admin, "vendedor")
            val brasilId = Json.parseToJsonElement(client.get("/paises") { auth(admin) }.bodyAsText())
                .jsonArray.first { it.jsonObject["sigla"]!!.jsonPrimitive.content == "BR" }
                .jsonObject["id"]!!.jsonPrimitive.long

            assertEquals(HttpStatusCode.OK, client.get("/usuarios") { auth(gestor) }.status)
            assertEquals(HttpStatusCode.OK, client.get("/empresas") { auth(gestor) }.status)
            assertEquals(
                HttpStatusCode.Forbidden,
                client.post("/empresas") {
                    auth(gestor)
                    contentType(ContentType.Application.Json)
                    setBody("""{"razaoSocial":"X","nomeFantasia":"X","ruc":"1"}""")
                }.status,
            )
            assertEquals(
                HttpStatusCode.Created,
                client.post("/documentos-tipos") {
                    auth(gestor)
                    contentType(ContentType.Application.Json)
                    setBody(
                        """{"idPais":$brasilId,"tipoPessoa":"fisica","codigo":"GT${System.nanoTime() % 10000}","nome":"Gestor Doc","unico":false}""",
                    )
                }.status,
            )

            assertEquals(HttpStatusCode.OK, client.get("/produtos") { auth(operador) }.status)
            assertEquals(HttpStatusCode.OK, client.get("/marcas") { auth(operador) }.status)
            assertEquals(HttpStatusCode.OK, client.get("/estoques") { auth(operador) }.status)
            assertEquals(HttpStatusCode.OK, client.get("/clientes") { auth(operador) }.status)
            assertEquals(HttpStatusCode.OK, client.get("/documentos-tipos") { auth(operador) }.status)
            assertEquals(HttpStatusCode.Forbidden, client.get("/usuarios") { auth(operador) }.status)
            assertEquals(HttpStatusCode.Forbidden, client.get("/empresas") { auth(operador) }.status)
            assertEquals(
                HttpStatusCode.Forbidden,
                client.post("/documentos-tipos") {
                    auth(operador)
                    contentType(ContentType.Application.Json)
                    setBody(
                        """{"idPais":$brasilId,"tipoPessoa":"fisica","codigo":"OP${System.nanoTime() % 10000}","nome":"Op Doc","unico":false}""",
                    )
                }.status,
            )

            assertEquals(HttpStatusCode.OK, client.get("/clientes") { auth(vendedor) }.status)
            assertEquals(HttpStatusCode.Forbidden, client.get("/usuarios") { auth(vendedor) }.status)
            assertEquals(
                HttpStatusCode.Forbidden,
                client.post("/clientes") {
                    auth(vendedor)
                    contentType(ContentType.Application.Json)
                    setBody("""{"status":"ativo"}""")
                }.status,
            )
        }
    }

    @Test
    fun `perfil autenticado expoe permissoes do rbac`() = testApplication {
        configure()
        withAuth { token ->
            val body = Json.parseToJsonElement(client.get("/auth/me") { auth(token) }.bodyAsText()).jsonObject
            val permissoes = body["permissoes"]!!.jsonArray.map { it.jsonPrimitive.content }.toSet()
            assertTrue(permissoes.containsAll(Rbac.codigos(PerfilUsuario.ADMINISTRADOR)))
        }
    }
}
