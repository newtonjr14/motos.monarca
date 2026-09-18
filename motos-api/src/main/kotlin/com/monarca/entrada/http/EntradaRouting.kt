package com.monarca.entrada.http

import com.monarca.auth.JWT_AUTH
import com.monarca.auth.podeOperarFinanceiro
import com.monarca.auth.usuarioAutenticado
import com.monarca.auth.withAudit
import com.monarca.common.http.respondBadRequest
import com.monarca.common.http.respondForbidden
import com.monarca.common.http.respondNotFound
import com.monarca.entrada.dto.EntradaRequest
import com.monarca.entrada.service.EntradaService
import com.monarca.localidade.service.AcessoNegado
import com.monarca.localidade.service.RecursoNaoEncontrado
import com.monarca.localidade.service.RequisicaoInvalida
import io.ktor.http.HttpStatusCode
import io.ktor.server.application.Application
import io.ktor.server.application.ApplicationCall
import io.ktor.server.auth.authenticate
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.resources.get
import io.ktor.server.resources.post
import io.ktor.server.routing.routing
import org.koin.ktor.ext.get as koinGet

fun Application.configureEntrada() {
    val service = koinGet<EntradaService>()
    routing {
        authenticate(JWT_AUTH) {
            get<Entradas> {
                call.handleEntrada {
                    call.podeOperarFinanceiro()
                    val idFilial = call.request.queryParameters["idFilial"]?.toLongOrNull()
                    call.respond(service.listar(idFilial, call.usuarioAutenticado().id))
                }
            }
            get<Entradas.Id> { resource ->
                call.handleEntrada {
                    call.podeOperarFinanceiro()
                    call.respond(service.buscar(resource.id, call.usuarioAutenticado().id))
                }
            }
            post<Entradas> {
                call.handleEntrada {
                    call.podeOperarFinanceiro()
                    val request = call.receive<EntradaRequest>()
                    call.withAudit {
                        call.respond(HttpStatusCode.Created, service.criar(request, call.usuarioAutenticado().id))
                    }
                }
            }
        }
    }
}

private suspend fun ApplicationCall.handleEntrada(block: suspend () -> Unit) {
    try {
        block()
    } catch (e: RecursoNaoEncontrado) {
        respondNotFound(e)
    } catch (e: RequisicaoInvalida) {
        respondBadRequest(e)
    } catch (e: AcessoNegado) {
        respondForbidden(e)
    }
}
