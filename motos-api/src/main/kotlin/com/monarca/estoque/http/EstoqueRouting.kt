package com.monarca.estoque.http

import com.monarca.auth.JWT_AUTH
import com.monarca.auth.podeConsultarEstoque
import com.monarca.auth.podeGerenciarEstoque
import com.monarca.auth.usuarioAutenticado
import com.monarca.auth.withAudit
import com.monarca.common.http.respondBadRequest
import com.monarca.common.http.respondForbidden
import com.monarca.common.http.respondNotFound
import com.monarca.estoque.dto.EstoqueProdutoRequest
import com.monarca.estoque.dto.EstoqueRequest
import com.monarca.estoque.service.EstoqueService
import com.monarca.localidade.service.AcessoNegado
import com.monarca.localidade.service.RecursoNaoEncontrado
import com.monarca.localidade.service.RequisicaoInvalida
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

fun Application.configureEstoque() {
    val service = koinGet<EstoqueService>()

    routing {
        authenticate(JWT_AUTH) {
            get<Estoques> { resource ->
                call.handleEstoque {
                    call.podeConsultarEstoque()
                    call.respond(service.listar(resource.idFilial, call.usuarioAutenticado().id))
                }
            }
            get<Estoques.Id> { resource ->
                call.handleEstoque {
                    call.podeConsultarEstoque()
                    call.respond(service.buscar(resource.id, call.usuarioAutenticado().id))
                }
            }
            post<Estoques> {
                call.handleEstoque {
                    call.podeGerenciarEstoque()
                    val request = call.receive<EstoqueRequest>()
                    call.withAudit {
                        call.respond(HttpStatusCode.Created, service.criar(request, call.usuarioAutenticado().id))
                    }
                }
            }
            put<Estoques.Id> { resource ->
                call.handleEstoque {
                    call.podeGerenciarEstoque()
                    val request = call.receive<EstoqueRequest>()
                    call.withAudit {
                        call.respond(service.atualizar(resource.id, request, call.usuarioAutenticado().id))
                    }
                }
            }
            delete<Estoques.Id> { resource ->
                call.handleEstoque {
                    call.podeGerenciarEstoque()
                    call.withAudit {
                        service.excluir(resource.id, call.usuarioAutenticado().id)
                        call.respond(HttpStatusCode.NoContent)
                    }
                }
            }
            get<EstoqueProdutos> { resource ->
                call.handleEstoque {
                    call.podeConsultarEstoque()
                    call.respond(service.listarItens(resource.idEstoque, resource.idFilial, call.usuarioAutenticado().id))
                }
            }
            get<EstoqueProdutos.Id> { resource ->
                call.handleEstoque {
                    call.podeConsultarEstoque()
                    call.respond(service.buscarItem(resource.id, call.usuarioAutenticado().id))
                }
            }
            post<EstoqueProdutos> {
                call.handleEstoque {
                    call.podeGerenciarEstoque()
                    val request = call.receive<EstoqueProdutoRequest>()
                    call.withAudit {
                        call.respond(HttpStatusCode.Created, service.criarItem(request, call.usuarioAutenticado().id))
                    }
                }
            }
            put<EstoqueProdutos.Id> { resource ->
                call.handleEstoque {
                    call.podeGerenciarEstoque()
                    val request = call.receive<EstoqueProdutoRequest>()
                    call.withAudit {
                        call.respond(service.atualizarItem(resource.id, request, call.usuarioAutenticado().id))
                    }
                }
            }
            delete<EstoqueProdutos.Id> { resource ->
                call.handleEstoque {
                    call.podeGerenciarEstoque()
                    call.withAudit {
                        service.excluirItem(resource.id, call.usuarioAutenticado().id)
                        call.respond(HttpStatusCode.NoContent)
                    }
                }
            }
        }
    }
}

private suspend fun ApplicationCall.handleEstoque(block: suspend () -> Unit) {
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
