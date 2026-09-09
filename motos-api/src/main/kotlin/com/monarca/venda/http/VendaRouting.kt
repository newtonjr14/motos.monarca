package com.monarca.venda.http

import com.monarca.auth.JWT_AUTH
import com.monarca.auth.podeRegistrarVenda
import com.monarca.auth.usuarioAutenticado
import com.monarca.auth.withAudit
import com.monarca.common.http.respondBadRequest
import com.monarca.common.http.respondForbidden
import com.monarca.common.http.respondNotFound
import com.monarca.localidade.service.AcessoNegado
import com.monarca.localidade.service.RecursoNaoEncontrado
import com.monarca.localidade.service.RequisicaoInvalida
import com.monarca.venda.dto.VendaRequest
import com.monarca.venda.service.VendaService
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

fun Application.configureVenda() {
    val service = koinGet<VendaService>()

    routing {
        authenticate(JWT_AUTH) {
            get<Vendas> { resource ->
                call.handleVenda {
                    call.podeRegistrarVenda()
                    call.respond(service.listar(resource.idFilial, call.usuarioAutenticado().id))
                }
            }
            get<Vendas.Vendedores> { resource ->
                call.handleVenda {
                    call.podeRegistrarVenda()
                    call.respond(service.listarVendedores(resource.idFilial, call.usuarioAutenticado().id))
                }
            }
            get<Vendas.Id> { resource ->
                call.handleVenda {
                    call.podeRegistrarVenda()
                    call.respond(service.buscar(resource.id, call.usuarioAutenticado().id))
                }
            }
            post<Vendas> {
                call.handleVenda {
                    call.podeRegistrarVenda()
                    val request = call.receive<VendaRequest>()
                    call.withAudit {
                        call.respond(HttpStatusCode.Created, service.criar(request, call.usuarioAutenticado().id))
                    }
                }
            }
        }
    }
}

private suspend fun ApplicationCall.handleVenda(block: suspend () -> Unit) {
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
