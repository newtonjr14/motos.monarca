package com.monarca.caixa.http

import com.monarca.auth.JWT_AUTH
import com.monarca.auth.podeConsultarCaixa
import com.monarca.auth.podeGerenciarCaixa
import com.monarca.auth.podeOperarCaixa
import com.monarca.auth.usuarioAutenticado
import com.monarca.auth.withAudit
import com.monarca.caixa.dto.AbrirSessaoRequest
import com.monarca.caixa.dto.CaixaRequest
import com.monarca.caixa.dto.FecharSessaoRequest
import com.monarca.caixa.dto.FinalizadorRequest
import com.monarca.caixa.dto.TransferenciaCaixaRequest
import com.monarca.caixa.service.CaixaService
import com.monarca.common.http.respondBadRequest
import com.monarca.common.http.respondForbidden
import com.monarca.common.http.respondNotFound
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

fun Application.configureCaixa() {
    val service = koinGet<CaixaService>()

    routing {
        authenticate(JWT_AUTH) {
            get<Finalizadores> {
                call.handleCaixa {
                    call.podeConsultarCaixa()
                    call.respond(service.listarFinalizadores())
                }
            }
            get<Finalizadores.Id> { resource ->
                call.handleCaixa {
                    call.podeConsultarCaixa()
                    call.respond(service.buscarFinalizador(resource.id))
                }
            }
            post<Finalizadores> {
                call.handleCaixa {
                    call.podeGerenciarCaixa()
                    val request = call.receive<FinalizadorRequest>()
                    call.withAudit {
                        call.respond(HttpStatusCode.Created, service.criarFinalizador(request))
                    }
                }
            }
            put<Finalizadores.Id> { resource ->
                call.handleCaixa {
                    call.podeGerenciarCaixa()
                    val request = call.receive<FinalizadorRequest>()
                    call.withAudit {
                        call.respond(service.atualizarFinalizador(resource.id, request))
                    }
                }
            }
            delete<Finalizadores.Id> { resource ->
                call.handleCaixa {
                    call.podeGerenciarCaixa()
                    call.withAudit {
                        service.excluirFinalizador(resource.id)
                        call.respond(HttpStatusCode.NoContent)
                    }
                }
            }

            get<Caixas> { resource ->
                call.handleCaixa {
                    call.podeConsultarCaixa()
                    val usuario = call.usuarioAutenticado()
                    call.respond(service.listarCaixas(resource.idFilial, usuario.id, resource.somenteComAcesso))
                }
            }
            get<Caixas.Id> { resource ->
                call.handleCaixa {
                    call.podeConsultarCaixa()
                    call.respond(service.buscarCaixa(resource.id, call.usuarioAutenticado().id))
                }
            }
            post<Caixas> {
                call.handleCaixa {
                    call.podeGerenciarCaixa()
                    val request = call.receive<CaixaRequest>()
                    call.withAudit {
                        call.respond(HttpStatusCode.Created, service.criarCaixa(request, call.usuarioAutenticado().id))
                    }
                }
            }
            put<Caixas.Id> { resource ->
                call.handleCaixa {
                    call.podeGerenciarCaixa()
                    val request = call.receive<CaixaRequest>()
                    call.withAudit {
                        call.respond(service.atualizarCaixa(resource.id, request, call.usuarioAutenticado().id))
                    }
                }
            }
            delete<Caixas.Id> { resource ->
                call.handleCaixa {
                    call.podeGerenciarCaixa()
                    call.withAudit {
                        service.excluirCaixa(resource.id, call.usuarioAutenticado().id)
                        call.respond(HttpStatusCode.NoContent)
                    }
                }
            }
            get<Caixas.Id.Sessoes> { resource ->
                call.handleCaixa {
                    call.podeConsultarCaixa()
                    call.respond(service.listarSessoes(resource.parent.id, call.usuarioAutenticado().id))
                }
            }

            get<MeusCaixas> { resource ->
                call.handleCaixa {
                    call.podeOperarCaixa()
                    call.respond(service.listarMeusCaixas(call.usuarioAutenticado().id, resource.idFilial))
                }
            }

            post<CaixaSessoes> {
                call.handleCaixa {
                    call.podeOperarCaixa()
                    val request = call.receive<AbrirSessaoRequest>()
                    call.withAudit {
                        call.respond(HttpStatusCode.Created, service.abrirSessao(request, call.usuarioAutenticado().id))
                    }
                }
            }
            get<CaixaSessoes.Id> { resource ->
                call.handleCaixa {
                    call.podeConsultarCaixa()
                    call.respond(service.buscarSessao(resource.id, call.usuarioAutenticado().id))
                }
            }
            post<CaixaSessoes.Id.Fechar> { resource ->
                call.handleCaixa {
                    call.podeOperarCaixa()
                    val request = call.receive<FecharSessaoRequest>()
                    call.withAudit {
                        call.respond(service.fecharSessao(resource.parent.id, request, call.usuarioAutenticado().id))
                    }
                }
            }
            post<CaixaSessoes.Id.Transferencias> { resource ->
                call.handleCaixa {
                    call.podeOperarCaixa()
                    val request = call.receive<TransferenciaCaixaRequest>()
                    call.withAudit {
                        service.transferir(resource.parent.id, request, call.usuarioAutenticado().id)
                        call.respond(HttpStatusCode.NoContent)
                    }
                }
            }
            get<CaixaSessoes.Id.Movimentacoes> { resource ->
                call.handleCaixa {
                    call.podeConsultarCaixa()
                    call.respond(service.listarMovimentacoes(resource.parent.id, call.usuarioAutenticado().id))
                }
            }
        }
    }
}

private suspend fun ApplicationCall.handleCaixa(block: suspend () -> Unit) {
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
