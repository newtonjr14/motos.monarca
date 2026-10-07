package com.monarca.titulo.http

import com.monarca.auth.JWT_AUTH
import com.monarca.auth.podeOperarFinanceiro
import com.monarca.auth.usuarioAutenticado
import com.monarca.auth.withAudit
import com.monarca.common.http.respondBadRequest
import com.monarca.common.http.respondForbidden
import com.monarca.common.http.respondNotFound
import com.monarca.localidade.service.AcessoNegado
import com.monarca.localidade.service.RecursoNaoEncontrado
import com.monarca.localidade.service.RequisicaoInvalida
import com.monarca.titulo.dto.BaixaTituloRequest
import com.monarca.titulo.dto.TituloPagarRequest
import com.monarca.titulo.dto.TituloReceberRequest
import com.monarca.titulo.service.TituloService
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

fun Application.configureTitulo() {
    val service = koinGet<TituloService>()
    routing {
        authenticate(JWT_AUTH) {
            get<TitulosReceber> {
                call.handleTitulo {
                    call.podeOperarFinanceiro()
                    val idFilial = call.request.queryParameters["idFilial"]?.toLongOrNull()
                    call.respond(service.listarReceber(idFilial, call.usuarioAutenticado().id))
                }
            }
            get<TitulosReceber.Id> { resource ->
                call.handleTitulo {
                    call.podeOperarFinanceiro()
                    call.respond(service.buscarReceber(resource.id, call.usuarioAutenticado().id))
                }
            }
            post<TitulosReceber> {
                call.handleTitulo {
                    call.podeOperarFinanceiro()
                    val request = call.receive<TituloReceberRequest>()
                    call.withAudit {
                        call.respond(HttpStatusCode.Created, service.criarReceberManual(request, call.usuarioAutenticado().id))
                    }
                }
            }
            get<RelatorioParcelasReceber> { resource ->
                call.handleTitulo {
                    call.podeOperarFinanceiro()
                    call.respond(service.listarParcelasReceber(resource.idFilial, call.usuarioAutenticado().id))
                }
            }
            get<BaixasReceber> { resource ->
                call.handleTitulo {
                    call.podeOperarFinanceiro()
                    call.respond(service.listarBaixasReceber(resource.idFilial, call.usuarioAutenticado().id))
                }
            }
            post<Recebimentos> {
                call.handleTitulo {
                    call.podeOperarFinanceiro()
                    val request = call.receive<BaixaTituloRequest>()
                    call.withAudit {
                        call.respond(service.baixarReceber(request, call.usuarioAutenticado().id))
                    }
                }
            }

            get<TitulosPagar> {
                call.handleTitulo {
                    call.podeOperarFinanceiro()
                    val idFilial = call.request.queryParameters["idFilial"]?.toLongOrNull()
                    call.respond(service.listarPagar(idFilial, call.usuarioAutenticado().id))
                }
            }
            get<TitulosPagar.Id> { resource ->
                call.handleTitulo {
                    call.podeOperarFinanceiro()
                    call.respond(service.buscarPagar(resource.id, call.usuarioAutenticado().id))
                }
            }
            post<TitulosPagar> {
                call.handleTitulo {
                    call.podeOperarFinanceiro()
                    val request = call.receive<TituloPagarRequest>()
                    call.withAudit {
                        call.respond(HttpStatusCode.Created, service.criarPagarManual(request, call.usuarioAutenticado().id))
                    }
                }
            }
            get<RelatorioParcelasPagar> { resource ->
                call.handleTitulo {
                    call.podeOperarFinanceiro()
                    call.respond(service.listarParcelasPagar(resource.idFilial, call.usuarioAutenticado().id))
                }
            }
            get<BaixasPagar> { resource ->
                call.handleTitulo {
                    call.podeOperarFinanceiro()
                    call.respond(service.listarBaixasPagar(resource.idFilial, call.usuarioAutenticado().id))
                }
            }
            post<Pagamentos> {
                call.handleTitulo {
                    call.podeOperarFinanceiro()
                    val request = call.receive<BaixaTituloRequest>()
                    call.withAudit {
                        call.respond(service.baixarPagar(request, call.usuarioAutenticado().id))
                    }
                }
            }
        }
    }
}

private suspend fun ApplicationCall.handleTitulo(block: suspend () -> Unit) {
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
