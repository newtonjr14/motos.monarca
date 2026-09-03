package com.monarca.empresa.http

import com.monarca.auth.JWT_AUTH
import com.monarca.auth.podeConsultarEmpresa
import com.monarca.auth.podeGerenciarEmpresa
import com.monarca.auth.withAudit
import com.monarca.common.http.respondBadRequest
import com.monarca.common.http.respondForbidden
import com.monarca.common.http.respondNotFound
import com.monarca.empresa.dto.EmpresaRequest
import com.monarca.empresa.dto.FilialRequest
import com.monarca.empresa.service.EmpresaService
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

fun Application.configureEmpresa() {
    val service = koinGet<EmpresaService>()

    routing {
        authenticate(JWT_AUTH) {
            get<Empresas> {
                call.handleEmpresa {
                    call.podeConsultarEmpresa()
                    call.respond(service.listarEmpresas())
                }
            }
            get<Empresas.Id> { resource ->
                call.handleEmpresa {
                    call.podeConsultarEmpresa()
                    call.respond(service.buscarEmpresa(resource.id))
                }
            }
            post<Empresas> {
                call.handleEmpresa {
                    call.podeGerenciarEmpresa()
                    val request = call.receive<EmpresaRequest>()
                    call.withAudit {
                        call.respond(HttpStatusCode.Created, service.criarEmpresa(request))
                    }
                }
            }
            put<Empresas.Id> { resource ->
                call.handleEmpresa {
                    call.podeGerenciarEmpresa()
                    val request = call.receive<EmpresaRequest>()
                    call.withAudit {
                        call.respond(service.atualizarEmpresa(resource.id, request))
                    }
                }
            }
            delete<Empresas.Id> { resource ->
                call.handleEmpresa {
                    call.podeGerenciarEmpresa()
                    call.withAudit {
                        service.excluirEmpresa(resource.id)
                        call.respond(HttpStatusCode.NoContent)
                    }
                }
            }
            get<Filiais> { resource ->
                call.handleEmpresa {
                    call.podeConsultarEmpresa()
                    call.respond(service.listarFiliais(resource.idEmpresa))
                }
            }
            get<Filiais.Principal> {
                call.handleEmpresa {
                    call.podeConsultarEmpresa()
                    call.respond(service.buscarFilialPrincipal())
                }
            }
            get<Filiais.Id> { resource ->
                call.handleEmpresa {
                    call.podeConsultarEmpresa()
                    call.respond(service.buscarFilial(resource.id))
                }
            }
            post<Filiais> {
                call.handleEmpresa {
                    call.podeGerenciarEmpresa()
                    val request = call.receive<FilialRequest>()
                    call.withAudit {
                        call.respond(HttpStatusCode.Created, service.criarFilial(request))
                    }
                }
            }
            put<Filiais.Id> { resource ->
                call.handleEmpresa {
                    call.podeGerenciarEmpresa()
                    val request = call.receive<FilialRequest>()
                    call.withAudit {
                        call.respond(service.atualizarFilial(resource.id, request))
                    }
                }
            }
            delete<Filiais.Id> { resource ->
                call.handleEmpresa {
                    call.podeGerenciarEmpresa()
                    call.withAudit {
                        service.excluirFilial(resource.id)
                        call.respond(HttpStatusCode.NoContent)
                    }
                }
            }
        }
    }
}

private suspend fun ApplicationCall.handleEmpresa(block: suspend () -> Unit) {
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
