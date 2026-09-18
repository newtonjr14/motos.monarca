package com.monarca.factura.http

import com.monarca.auth.JWT_AUTH
import com.monarca.auth.podeEmitirFactura
import com.monarca.auth.usuarioAutenticado
import com.monarca.auth.withAudit
import com.monarca.common.http.respondBadRequest
import com.monarca.common.http.respondForbidden
import com.monarca.common.http.respondNotFound
import com.monarca.factura.dto.FacturaEmitirRequest
import com.monarca.factura.service.FacturaService
import com.monarca.localidade.service.AcessoNegado
import com.monarca.localidade.service.RecursoNaoEncontrado
import com.monarca.localidade.service.RequisicaoInvalida
import com.monarca.localidade.service.invalido
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

fun Application.configureFactura() {
    val service = koinGet<FacturaService>()
    routing {
        authenticate(JWT_AUTH) {
            get<Facturas> {
                call.handleFactura {
                    call.podeEmitirFactura()
                    val idFilial = call.request.queryParameters["idFilial"]?.toLongOrNull()
                    call.respond(service.listar(idFilial, call.usuarioAutenticado().id))
                }
            }
            get<Facturas.VendasElegiveis> {
                call.handleFactura {
                    call.podeEmitirFactura()
                    val idFilial = call.request.queryParameters["idFilial"]?.toLongOrNull()
                    call.respond(service.listarVendasElegiveis(idFilial, call.usuarioAutenticado().id))
                }
            }
            get<Facturas.PorVenda> {
                call.handleFactura {
                    call.podeEmitirFactura()
                    val idVenda = call.request.queryParameters["idVenda"]?.toLongOrNull()
                        ?: throw invalido("ID_VENDA", "Informe idVenda")
                    val factura = service.buscarPorVenda(idVenda, call.usuarioAutenticado().id)
                    if (factura == null) {
                        call.respond(HttpStatusCode.NoContent)
                    } else {
                        call.respond(factura)
                    }
                }
            }
            get<Facturas.Id> { resource ->
                call.handleFactura {
                    call.podeEmitirFactura()
                    call.respond(service.buscar(resource.id, call.usuarioAutenticado().id))
                }
            }
            post<Facturas> {
                call.handleFactura {
                    call.podeEmitirFactura()
                    val request = call.receive<FacturaEmitirRequest>()
                    call.withAudit {
                        call.respond(HttpStatusCode.Created, service.emitir(request, call.usuarioAutenticado().id))
                    }
                }
            }
            post<Facturas.Id.Enviar> { resource ->
                call.handleFactura {
                    call.podeEmitirFactura()
                    call.withAudit {
                        call.respond(service.enviar(resource.parent.id, call.usuarioAutenticado().id))
                    }
                }
            }
            post<Facturas.Id.Consultar> { resource ->
                call.handleFactura {
                    call.podeEmitirFactura()
                    call.withAudit {
                        call.respond(service.consultar(resource.parent.id, call.usuarioAutenticado().id))
                    }
                }
            }
        }
    }
}

private suspend fun ApplicationCall.handleFactura(block: suspend () -> Unit) {
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
