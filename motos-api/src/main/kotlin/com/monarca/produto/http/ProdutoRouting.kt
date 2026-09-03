package com.monarca.produto.http

import com.monarca.auth.JWT_AUTH
import com.monarca.auth.podeConsultarProduto
import com.monarca.auth.podeGerenciarProduto
import com.monarca.auth.usuarioAutenticado
import com.monarca.auth.withAudit
import com.monarca.common.http.respondBadRequest
import com.monarca.common.http.respondForbidden
import com.monarca.common.http.respondNotFound
import com.monarca.localidade.service.AcessoNegado
import com.monarca.localidade.service.RecursoNaoEncontrado
import com.monarca.localidade.service.RequisicaoInvalida
import com.monarca.produto.dto.ProdutoRequest
import com.monarca.produto.service.ProdutoService
import com.monarca.produto.service.VinculoFilialProdutoConflito
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

fun Application.configureProduto() {
    val service = koinGet<ProdutoService>()

    routing {
        authenticate(JWT_AUTH) {
            get<Produtos> { resource ->
                call.handleProduto(service) {
                    call.podeConsultarProduto()
                    call.respond(service.listar(resource.idFilial, resource.tipo, call.usuarioAutenticado().id))
                }
            }
            get<Produtos.Id> { resource ->
                call.handleProduto(service) {
                    call.podeConsultarProduto()
                    call.respond(service.buscar(resource.id, resource.idFilial, call.usuarioAutenticado().id))
                }
            }
            post<Produtos> {
                call.handleProduto(service) {
                    call.podeGerenciarProduto()
                    val request = call.receive<ProdutoRequest>()
                    call.withAudit {
                        call.respond(HttpStatusCode.Created, service.criar(request, call.usuarioAutenticado().id))
                    }
                }
            }
            put<Produtos.Id> { resource ->
                call.handleProduto(service) {
                    call.podeGerenciarProduto()
                    val request = call.receive<ProdutoRequest>()
                    call.withAudit {
                        call.respond(service.atualizar(resource.id, request))
                    }
                }
            }
            delete<Produtos.Id> { resource ->
                call.handleProduto(service) {
                    call.podeGerenciarProduto()
                    call.withAudit {
                        service.excluir(resource.id, resource.idFilial, call.usuarioAutenticado().id)
                        call.respond(HttpStatusCode.NoContent)
                    }
                }
            }
        }
    }
}

private suspend fun ApplicationCall.handleProduto(service: ProdutoService, block: suspend () -> Unit) {
    try {
        block()
    } catch (e: RecursoNaoEncontrado) {
        respondNotFound(e)
    } catch (e: RequisicaoInvalida) {
        respondBadRequest(e)
    } catch (e: AcessoNegado) {
        respondForbidden(e)
    } catch (e: VinculoFilialProdutoConflito) {
        respond(HttpStatusCode.Conflict, service.toVinculoResponse(e))
    }
}
