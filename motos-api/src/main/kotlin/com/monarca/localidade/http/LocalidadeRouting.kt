package com.monarca.localidade.http

import com.monarca.auth.JWT_AUTH
import com.monarca.auth.podeConsultarLocalidade
import com.monarca.auth.podeGerenciarLocalidade
import com.monarca.auth.withAudit
import com.monarca.localidade.dto.CidadeRequest
import com.monarca.localidade.dto.DivisaoRequest
import com.monarca.localidade.dto.MensagemErro
import com.monarca.localidade.dto.PaisRequest
import com.monarca.localidade.service.AcessoNegado
import com.monarca.localidade.service.LocalidadeService
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

suspend fun Application.configureLocalidade() {
    val service = koinGet<LocalidadeService>()
    service.init()

    routing {
        authenticate(JWT_AUTH) {
            get<Paises> {
                call.handleLocalidade {
                    call.podeConsultarLocalidade()
                    call.respond(service.listarPaises())
                }
            }
            get<Paises.Id> { resource ->
                call.handleLocalidade {
                    call.podeConsultarLocalidade()
                    call.respond(service.buscarPais(resource.id))
                }
            }
            post<Paises> {
                call.handleLocalidade {
                    call.podeGerenciarLocalidade()
                    val request = call.receive<PaisRequest>()
                    call.withAudit {
                        call.respond(HttpStatusCode.Created, service.criarPais(request))
                    }
                }
            }
            put<Paises.Id> { resource ->
                call.handleLocalidade {
                    call.podeGerenciarLocalidade()
                    val request = call.receive<PaisRequest>()
                    call.withAudit {
                        call.respond(service.atualizarPais(resource.id, request))
                    }
                }
            }
            delete<Paises.Id> { resource ->
                call.handleLocalidade {
                    call.podeGerenciarLocalidade()
                    call.withAudit {
                        service.excluirPais(resource.id)
                        call.respond(HttpStatusCode.NoContent)
                    }
                }
            }
            get<Paises.Id.Divisoes> { resource ->
                call.handleLocalidade {
                    call.podeConsultarLocalidade()
                    call.respond(service.listarDivisoes(resource.parent.id))
                }
            }
            get<Divisoes> { resource ->
                call.handleLocalidade {
                    call.podeConsultarLocalidade()
                    call.respond(service.listarDivisoes(resource.idPais))
                }
            }
            get<Divisoes.Id> { resource ->
                call.handleLocalidade {
                    call.podeConsultarLocalidade()
                    call.respond(service.buscarDivisao(resource.id))
                }
            }
            post<Divisoes> {
                call.handleLocalidade {
                    call.podeGerenciarLocalidade()
                    val request = call.receive<DivisaoRequest>()
                    call.withAudit {
                        call.respond(HttpStatusCode.Created, service.criarDivisao(request))
                    }
                }
            }
            put<Divisoes.Id> { resource ->
                call.handleLocalidade {
                    call.podeGerenciarLocalidade()
                    val request = call.receive<DivisaoRequest>()
                    call.withAudit {
                        call.respond(service.atualizarDivisao(resource.id, request))
                    }
                }
            }
            delete<Divisoes.Id> { resource ->
                call.handleLocalidade {
                    call.podeGerenciarLocalidade()
                    call.withAudit {
                        service.excluirDivisao(resource.id)
                        call.respond(HttpStatusCode.NoContent)
                    }
                }
            }
            get<Cidades> { resource ->
                call.handleLocalidade {
                    call.podeConsultarLocalidade()
                    call.respond(service.listarCidades(resource.idPais, resource.idDivisao))
                }
            }
            get<Cidades.Id> { resource ->
                call.handleLocalidade {
                    call.podeConsultarLocalidade()
                    call.respond(service.buscarCidade(resource.id))
                }
            }
            post<Cidades> {
                call.handleLocalidade {
                    call.podeGerenciarLocalidade()
                    val request = call.receive<CidadeRequest>()
                    call.withAudit {
                        call.respond(HttpStatusCode.Created, service.criarCidade(request))
                    }
                }
            }
            put<Cidades.Id> { resource ->
                call.handleLocalidade {
                    call.podeGerenciarLocalidade()
                    val request = call.receive<CidadeRequest>()
                    call.withAudit {
                        call.respond(service.atualizarCidade(resource.id, request))
                    }
                }
            }
            delete<Cidades.Id> { resource ->
                call.handleLocalidade {
                    call.podeGerenciarLocalidade()
                    call.withAudit {
                        service.excluirCidade(resource.id)
                        call.respond(HttpStatusCode.NoContent)
                    }
                }
            }
        }
    }
}

private suspend fun ApplicationCall.handleLocalidade(block: suspend () -> Unit) {
    try {
        block()
    } catch (e: RecursoNaoEncontrado) {
        respond(HttpStatusCode.NotFound, MensagemErro(e.message ?: "Não encontrado"))
    } catch (e: RequisicaoInvalida) {
        respond(HttpStatusCode.BadRequest, MensagemErro(e.message ?: "Requisição inválida"))
    } catch (e: AcessoNegado) {
        respond(HttpStatusCode.Forbidden, MensagemErro(e.message ?: "Acesso negado"))
    }
}
