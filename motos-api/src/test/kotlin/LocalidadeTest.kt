package com.monarca

import com.monarca.localidade.repository.foldNome
import com.monarca.localidade.repository.lerDistritosBr
import com.monarca.localidade.repository.lerMunicipiosBr
import com.monarca.localidade.repository.lerMunicipiosPy
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
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.long

class LocalidadeTest {

    @Test
    fun `semente tem municipio e distrito do brasil e paraguai`() {
        val municipios = lerMunicipiosBr()
        assertTrue(municipios.any { it.chaveDivisao == "MS" && it.nome == "Ponta Porã" })
        assertTrue(municipios.any { it.chaveDivisao == "MS" && it.nome == "Nova Andradina" })
        val distritos = lerDistritosBr()
        assertTrue(distritos.any { it.nome == "Nova Casa Verde" && it.municipio == "Nova Andradina" })
        assertTrue(distritos.none { foldNome(it.nome) == foldNome(it.municipio) })
        val py = lerMunicipiosPy()
        assertTrue(py.any { it.nome.contains("Asunci", ignoreCase = true) })
        assertTrue(py.size >= 200)
    }

    @Test
    fun `paises divisoes e cidades tem crud`() = testApplication {
        configure(seedDemo = false)
        withAuth { token ->
            val paisesResponse = client.get("/paises") { auth(token) }
            assertEquals(HttpStatusCode.OK, paisesResponse.status)
            val paises = Json.parseToJsonElement(paisesResponse.bodyAsText()).jsonArray
            assertTrue(paises.size >= 2)

            val brasil = paises.first { it.jsonObject["sigla"]!!.jsonPrimitive.content == "BR" }.jsonObject
            val paraguai = paises.first { it.jsonObject["sigla"]!!.jsonPrimitive.content == "PY" }.jsonObject
            assertEquals(true, brasil["usaSiglaDivisao"]!!.jsonPrimitive.content.toBoolean())
            assertEquals("ativo", brasil["status"]!!.jsonPrimitive.content)
            assertEquals(false, paraguai["usaSiglaDivisao"]!!.jsonPrimitive.content.toBoolean())

            val brasilId = brasil["id"]!!.jsonPrimitive.long
            val paraguaiId = paraguai["id"]!!.jsonPrimitive.long

            val ufs = Json.parseToJsonElement(client.get("/paises/$brasilId/divisoes") { auth(token) }.bodyAsText()).jsonArray
            val departamentos = Json.parseToJsonElement(client.get("/paises/$paraguaiId/divisoes") { auth(token) }.bodyAsText()).jsonArray
            assertTrue(ufs.any { it.jsonObject["sigla"]?.jsonPrimitive?.content == "MS" })
            val amambay = departamentos.first { it.jsonObject["nome"]!!.jsonPrimitive.content == "Amambay" }.jsonObject
            assertEquals(JsonNull, amambay["sigla"])

            val msId = ufs.first { it.jsonObject["sigla"]?.jsonPrimitive?.content == "MS" }
                .jsonObject["id"]!!.jsonPrimitive.long

            val nome = "Ponta Porã ${System.nanoTime()}"
            val created = client.post("/cidades") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody("""{"nome":"$nome","idDivisao":$msId}""")
            }
            assertEquals(HttpStatusCode.Created, created.status)
            val cidade = Json.parseToJsonElement(created.bodyAsText()).jsonObject
            assertEquals(nome, cidade["nome"]!!.jsonPrimitive.content)
            assertEquals("MS", cidade["divisaoSigla"]!!.jsonPrimitive.content)
            assertEquals("BR", cidade["paisSigla"]!!.jsonPrimitive.content)
            assertEquals("ativo", cidade["status"]!!.jsonPrimitive.content)
            assertEquals("municipio", cidade["tipo"]!!.jsonPrimitive.content)

            val munNome = "Nova Andradina ${System.nanoTime()}"
            val mun = Json.parseToJsonElement(
                client.post("/cidades") {
                    auth(token)
                    contentType(ContentType.Application.Json)
                    setBody("""{"nome":"$munNome","idDivisao":$msId,"tipo":"municipio"}""")
                }.bodyAsText(),
            ).jsonObject
            val munId = mun["id"]!!.jsonPrimitive.long

            val distNome = "Nova Casa Verde ${System.nanoTime()}"
            val dist = client.post("/cidades") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody("""{"nome":"$distNome","idDivisao":$msId,"tipo":"distrito","idCidadeMunicipio":$munId}""")
            }
            assertEquals(HttpStatusCode.Created, dist.status, dist.bodyAsText())
            val distrito = Json.parseToJsonElement(dist.bodyAsText()).jsonObject
            assertEquals("distrito", distrito["tipo"]!!.jsonPrimitive.content)
            assertEquals(munNome, distrito["municipioNome"]!!.jsonPrimitive.content)

            val semPai = client.post("/cidades") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody("""{"nome":"Itamarati ${System.nanoTime()}","idDivisao":$msId,"tipo":"distrito"}""")
            }
            assertEquals(HttpStatusCode.BadRequest, semPai.status)
            assertEquals(
                "CIDADE_MUNICIPIO_OBRIGATORIO",
                Json.parseToJsonElement(semPai.bodyAsText()).jsonObject["codigo"]!!.jsonPrimitive.content,
            )

            val sede = client.post("/cidades") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody("""{"nome":"$munNome","idDivisao":$msId,"tipo":"distrito","idCidadeMunicipio":$munId}""")
            }
            assertEquals(HttpStatusCode.BadRequest, sede.status)
            assertEquals(
                "CIDADE_DISTRITO_SEDE",
                Json.parseToJsonElement(sede.bodyAsText()).jsonObject["codigo"]!!.jsonPrimitive.content,
            )

            val n = System.nanoTime()
            val munA = Json.parseToJsonElement(
                client.post("/cidades") {
                    auth(token)
                    contentType(ContentType.Application.Json)
                    setBody("""{"nome":"Alfa $n","idDivisao":$msId,"tipo":"municipio"}""")
                }.bodyAsText(),
            ).jsonObject
            val munB = Json.parseToJsonElement(
                client.post("/cidades") {
                    auth(token)
                    contentType(ContentType.Application.Json)
                    setBody("""{"nome":"Beta $n","idDivisao":$msId,"tipo":"municipio"}""")
                }.bodyAsText(),
            ).jsonObject
            val idA = munA["id"]!!.jsonPrimitive.long
            val idB = munB["id"]!!.jsonPrimitive.long
            val centroA = client.post("/cidades") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody("""{"nome":"Centro $n","idDivisao":$msId,"tipo":"distrito","idCidadeMunicipio":$idA}""")
            }
            val centroB = client.post("/cidades") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody("""{"nome":"Centro $n","idDivisao":$msId,"tipo":"distrito","idCidadeMunicipio":$idB}""")
            }
            assertEquals(HttpStatusCode.Created, centroA.status, centroA.bodyAsText())
            assertEquals(HttpStatusCode.Created, centroB.status, centroB.bodyAsText())

            val homonimo = client.post("/cidades") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody("""{"nome":"Alfa $n","idDivisao":$msId,"tipo":"distrito","idCidadeMunicipio":$idB}""")
            }
            assertEquals(HttpStatusCode.Created, homonimo.status, homonimo.bodyAsText())

            val sigla = "${'A' + ((n / 26) % 26).toInt()}${'A' + (n % 26).toInt()}"
            val paisCriado = client.post("/paises") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody("""{"nome":"Teste $sigla","sigla":"$sigla","usaSiglaDivisao":false}""")
            }
            assertEquals(HttpStatusCode.Created, paisCriado.status)
            val pais = Json.parseToJsonElement(paisCriado.bodyAsText()).jsonObject
            val paisId = pais["id"]!!.jsonPrimitive.long
            assertEquals(sigla, pais["sigla"]!!.jsonPrimitive.content)
            assertEquals("ativo", pais["status"]!!.jsonPrimitive.content)

            val updated = client.put("/paises/$paisId") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody("""{"nome":"Teste atualizado","sigla":"$sigla","usaSiglaDivisao":true,"status":"inativo"}""")
            }
            assertEquals(HttpStatusCode.OK, updated.status)
            val atualizado = Json.parseToJsonElement(updated.bodyAsText()).jsonObject
            assertEquals("Teste Atualizado", atualizado["nome"]!!.jsonPrimitive.content)
            assertEquals("inativo", atualizado["status"]!!.jsonPrimitive.content)
            assertEquals(HttpStatusCode.OK, client.get("/paises/$paisId") { auth(token) }.status)

            val deleted = client.delete("/paises/$paisId") { auth(token) }
            assertEquals(HttpStatusCode.NoContent, deleted.status)
            assertEquals(HttpStatusCode.NotFound, client.get("/paises/$paisId") { auth(token) }.status)

            val listados = Json.parseToJsonElement(client.get("/paises") { auth(token) }.bodyAsText()).jsonArray
            assertTrue(listados.none { it.jsonObject["id"]!!.jsonPrimitive.long == paisId })

            val divisaoNome = "Território ${System.nanoTime()}"
            val divisaoCriada = client.post("/divisoes") {
                auth(token)
                contentType(ContentType.Application.Json)
                setBody("""{"nome":"$divisaoNome","idPais":$brasilId,"sigla":"TT"}""")
            }
            assertEquals(HttpStatusCode.Created, divisaoCriada.status)
            val divisao = Json.parseToJsonElement(divisaoCriada.bodyAsText()).jsonObject
            val divisaoId = divisao["id"]!!.jsonPrimitive.long
            assertEquals("Território", divisao["nome"]!!.jsonPrimitive.content.take(10))

            assertEquals(HttpStatusCode.OK, client.get("/divisoes/$divisaoId") { auth(token) }.status)
            val divisaoDeleted = client.delete("/divisoes/$divisaoId") { auth(token) }
            assertEquals(HttpStatusCode.NoContent, divisaoDeleted.status)
            assertEquals(HttpStatusCode.NotFound, client.get("/divisoes/$divisaoId") { auth(token) }.status)
        }
    }
}
