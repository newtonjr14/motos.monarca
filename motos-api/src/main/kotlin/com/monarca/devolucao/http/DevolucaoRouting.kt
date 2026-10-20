package com.monarca.devolucao.http

import com.monarca.auth.JWT_AUTH
import com.monarca.auth.podeRegistrarVenda
import com.monarca.auth.usuarioAutenticado
import com.monarca.auth.withAudit
import com.monarca.common.http.respondBadRequest
import com.monarca.common.http.respondForbidden
import com.monarca.common.http.respondNotFound
import com.monarca.devolucao.dto.DevolucaoRequest
import com.monarca.devolucao.service.DevolucaoService
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

fun Application.configureDevolucao() {
    val service = koinGet<DevolucaoService>()
    routing {
        authenticate(JWT_AUTH) {
            get<Devolucoes> {
                call.handleDevolucao {
                    call.podeRegistrarVenda()
                    val idFilial = call.request.queryParameters["idFilial"]?.toLongOrNull()
                    call.respond(service.listar(idFilial, call.usuarioAutenticado().id))
                }
            }
            get<Devolucoes.Credito> {
                call.handleDevolucao {
                    call.podeRegistrarVenda()
                    val idFilial = call.request.queryParameters["idFilial"]?.toLongOrNull()
                    val idCliente = call.request.queryParameters["idCliente"]?.toLongOrNull()
                        ?: throw RequisicaoInvalida("CLIENTE_OBRIGATORIO", "Informe o cliente")
                    call.respond(service.saldoCredito(idFilial, idCliente, call.usuarioAutenticado().id))
                }
            }
            get<Devolucoes.Venda> { resource ->
                call.handleDevolucao {
                    call.podeRegistrarVenda()
                    call.respond(service.preview(resource.idVenda, call.usuarioAutenticado().id))
                }
            }
            get<Devolucoes.Id> { resource ->
                call.handleDevolucao {
                    call.podeRegistrarVenda()
                    call.respond(service.buscar(resource.id, call.usuarioAutenticado().id))
                }
            }
            post<Devolucoes> {
                call.handleDevolucao {
                    call.podeRegistrarVenda()
                    val request = call.receive<DevolucaoRequest>()
                    call.withAudit {
                        call.respond(HttpStatusCode.Created, service.criar(request, call.usuarioAutenticado().id))
                    }
                }
            }
        }
    }
}

private suspend fun ApplicationCall.handleDevolucao(block: suspend () -> Unit) {
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
