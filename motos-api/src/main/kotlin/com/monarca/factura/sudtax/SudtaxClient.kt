package com.monarca.factura.sudtax

import com.monarca.factura.dto.SudtaxDocumentoRequest
import com.monarca.factura.dto.SudtaxDocumentoResponse
import com.monarca.factura.dto.SudtaxErroResponse
import com.monarca.localidade.service.invalido
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.time.Duration

class SudtaxClient(
    private val config: SudtaxConfig,
) {
    private val http = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(15))
        .build()

    private val json = Json {
        ignoreUnknownKeys = true
        encodeDefaults = true
    }

    fun exigirHabilitado() {
        if (!config.enabled) {
            throw invalido("SUDTAX_DESLIGADA", "Integração SudTax desligada (sudtax.enabled=false)")
        }
        if (config.baseUrl.isBlank()) {
            throw invalido("SUDTAX_URL", "Configure sudtax.baseUrl")
        }
        if (config.apiKey.isBlank()) {
            throw invalido("SUDTAX_API_KEY", "Configure sudtax.apiKey (sk_test_… / sk_live_…)")
        }
    }

    suspend fun criarDocumento(request: SudtaxDocumentoRequest): SudtaxDocumentoResponse {
        exigirHabilitado()
        val body = json.encodeToString(SudtaxDocumentoRequest.serializer(), request)
        return post("/documentos", body, esperado = setOf(201, 200))
    }

    suspend fun enviar(idSudtax: Long): SudtaxDocumentoResponse {
        exigirHabilitado()
        return post("/documentos/$idSudtax/enviar", "{}", esperado = setOf(200, 201, 202))
    }

    suspend fun consultar(idSudtax: Long): SudtaxDocumentoResponse {
        exigirHabilitado()
        return post("/documentos/$idSudtax/consultar", "{}", esperado = setOf(200))
    }

    suspend fun buscar(idSudtax: Long): SudtaxDocumentoResponse {
        exigirHabilitado()
        return get("/documentos/$idSudtax")
    }

    private suspend fun post(path: String, body: String, esperado: Set<Int>): SudtaxDocumentoResponse =
        withContext(Dispatchers.IO) {
            val request = HttpRequest.newBuilder()
                .uri(URI.create(url(path)))
                .timeout(Duration.ofSeconds(60))
                .header("Authorization", "Bearer ${config.apiKey}")
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build()
            val response = http.send(request, HttpResponse.BodyHandlers.ofString())
            interpretar(response, esperado)
        }

    private suspend fun get(path: String): SudtaxDocumentoResponse =
        withContext(Dispatchers.IO) {
            val request = HttpRequest.newBuilder()
                .uri(URI.create(url(path)))
                .timeout(Duration.ofSeconds(60))
                .header("Authorization", "Bearer ${config.apiKey}")
                .header("Accept", "application/json")
                .GET()
                .build()
            val response = http.send(request, HttpResponse.BodyHandlers.ofString())
            interpretar(response, setOf(200))
        }

    private fun url(path: String): String {
        val base = config.baseUrl.trimEnd('/')
        val p = if (path.startsWith("/")) path else "/$path"
        return base + p
    }

    private fun interpretar(response: HttpResponse<String>, esperado: Set<Int>): SudtaxDocumentoResponse {
        val raw = response.body().orEmpty()
        if (response.statusCode() in esperado) {
            return runCatching { json.decodeFromString(SudtaxDocumentoResponse.serializer(), raw) }
                .getOrElse {
                    throw invalido("SUDTAX_RESPOSTA", "Resposta SudTax inválida", "body" to raw.take(400))
                }
        }

        val erro = runCatching { json.decodeFromString(SudtaxErroResponse.serializer(), raw) }.getOrNull()
        val codigo = erro?.codigo ?: "SUDTAX_ERRO"
        val mensagem = erro?.mensagem ?: erro?.message ?: raw.ifBlank { "Erro SudTax HTTP ${response.statusCode()}" }

        if (codigo == "DOCUMENTO_REFERENCIA_DUPLICADA" || response.statusCode() == 409) {
            throw invalido(
                "DOCUMENTO_REFERENCIA_DUPLICADA",
                mensagem.ifBlank { "Documento com esta referência já existe na SudTax" },
            )
        }

        throw invalido(codigo, mensagem, "httpStatus" to response.statusCode())
    }
}
