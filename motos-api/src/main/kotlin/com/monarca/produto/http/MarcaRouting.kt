package com.monarca.produto.http

import com.monarca.auth.JWT_AUTH
import com.monarca.auth.podeConsultarProduto
import com.monarca.auth.podeGerenciarProduto
import com.monarca.auth.withAudit
import com.monarca.common.http.respondBadRequest
import com.monarca.common.http.respondForbidden
import com.monarca.common.http.respondNotFound
import com.monarca.localidade.service.AcessoNegado
import com.monarca.localidade.service.RecursoNaoEncontrado
import com.monarca.localidade.service.RequisicaoInvalida
import com.monarca.produto.dto.MarcaRequest
import com.monarca.produto.dto.ModeloRequest
import com.monarca.produto.service.MarcaService
import io.ktor.http.HttpStatusCode
import io.ktor.server.application.Application
import io.ktor.server.application.ApplicationCall
import io.ktor.server.auth.authenticate
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.resources.delete
import io.ktor.server.resources.get
import io.ktor.server.resources.post
import io.ktor.server.resources.put
import io.ktor.server.routing.routing
import org.koin.ktor.ext.get as koinGet

fun Application.configureMarca() {
    val service = koinGet<MarcaService>()

    routing {
        authenticate(JWT_AUTH) {
            get<Marcas> {
                call.handleMarca {
                    call.podeConsultarProduto()
                    call.respond(service.listar())
                }
            }
            get<Marcas.Id> { resource ->
                call.handleMarca {
                    call.podeConsultarProduto()
                    call.respond(service.buscar(resource.id))
                }
            }
            post<Marcas> {
                call.handleMarca {
                    call.podeGerenciarProduto()
                    val request = call.receive<MarcaRequest>()
                    call.withAudit {
                        call.respond(HttpStatusCode.Created, service.criar(request))
                    }
                }
            }
            put<Marcas.Id> { resource ->
                call.handleMarca {
                    call.podeGerenciarProduto()
                    val request = call.receive<MarcaRequest>()
                    call.withAudit {
                        call.respond(service.atualizar(resource.id, request))
                    }
                }
            }
            delete<Marcas.Id> { resource ->
                call.handleMarca {
                    call.podeGerenciarProduto()
                    call.withAudit {
                        service.excluir(resource.id)
                        call.respond(HttpStatusCode.NoContent)
                    }
                }
            }
            get<Modelos> { resource ->
                call.handleMarca {
                    call.podeConsultarProduto()
                    call.respond(service.listarModelos(resource.idMarca, resource.tipo))
                }
            }
            get<Modelos.Id> { resource ->
                call.handleMarca {
                    call.podeConsultarProduto()
                    call.respond(service.buscarModelo(resource.id))
                }
            }
            post<Modelos> {
                call.handleMarca {
                    call.podeGerenciarProduto()
                    val request = call.receive<ModeloRequest>()
                    call.withAudit {
                        call.respond(HttpStatusCode.Created, service.criarModelo(request))
                    }
                }
            }
            put<Modelos.Id> { resource ->
                call.handleMarca {
                    call.podeGerenciarProduto()
                    val request = call.receive<ModeloRequest>()
                    call.withAudit {
                        call.respond(service.atualizarModelo(resource.id, request))
                    }
                }
            }
            delete<Modelos.Id> { resource ->
                call.handleMarca {
                    call.podeGerenciarProduto()
                    call.withAudit {
                        service.excluirModelo(resource.id)
                        call.respond(HttpStatusCode.NoContent)
                    }
                }
            }
        }
    }
}

private suspend fun ApplicationCall.handleMarca(block: suspend () -> Unit) {
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
