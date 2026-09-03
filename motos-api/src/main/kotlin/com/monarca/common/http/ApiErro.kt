package com.monarca.common.http

import com.monarca.common.dto.MensagemErro
import com.monarca.localidade.service.AcessoNegado
import com.monarca.localidade.service.RecursoNaoEncontrado
import com.monarca.localidade.service.RequisicaoInvalida
import io.ktor.http.HttpStatusCode
import io.ktor.server.application.ApplicationCall
import io.ktor.server.response.respond

suspend fun ApplicationCall.respondNotFound(e: RecursoNaoEncontrado) {
    respond(HttpStatusCode.NotFound, MensagemErro(e.codigo, e.message ?: "Não encontrado", e.params))
}

suspend fun ApplicationCall.respondBadRequest(e: RequisicaoInvalida) {
    respond(HttpStatusCode.BadRequest, MensagemErro(e.codigo, e.message ?: "Requisição inválida", e.params))
}

suspend fun ApplicationCall.respondForbidden(e: AcessoNegado) {
    respond(HttpStatusCode.Forbidden, MensagemErro(e.codigo, e.message ?: "Acesso negado", e.params))
}
