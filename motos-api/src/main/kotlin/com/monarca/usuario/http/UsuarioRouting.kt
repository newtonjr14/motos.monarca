package com.monarca.usuario.http

import com.monarca.auth.JWT_AUTH
import com.monarca.auth.domain.UsuarioAutenticado
import com.monarca.auth.withAudit
import com.monarca.common.http.respondBadRequest
import com.monarca.common.http.respondForbidden
import com.monarca.common.http.respondNotFound
import com.monarca.localidade.service.AcessoNegado
import com.monarca.localidade.service.RecursoNaoEncontrado
import com.monarca.localidade.service.RequisicaoInvalida
import com.monarca.usuario.dto.UsuarioRequest
import com.monarca.usuario.service.UsuarioService
import io.ktor.http.HttpStatusCode
import io.ktor.server.application.Application
import io.ktor.server.application.ApplicationCall
import io.ktor.server.auth.authenticate
import io.ktor.server.auth.principal
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.resources.delete
import io.ktor.server.resources.get
import io.ktor.server.resources.post
import io.ktor.server.resources.put
import io.ktor.server.routing.routing
import org.koin.ktor.ext.get as koinGet

suspend fun Application.configureUsuario() {
    val service = koinGet<UsuarioService>()
    service.init()

    routing {
        authenticate(JWT_AUTH) {
            get<Usuarios> {
                call.handleUsuario {
                    val atual = call.principal<UsuarioAutenticado>()!!
                    call.withAudit { call.respond(service.listar(atual)) }
                }
            }
            get<Usuarios.Id> { resource ->
                call.handleUsuario {
                    val atual = call.principal<UsuarioAutenticado>()!!
                    call.withAudit { call.respond(service.buscar(resource.id, atual)) }
                }
            }
            post<Usuarios> {
                call.handleUsuario {
                    val atual = call.principal<UsuarioAutenticado>()!!
                    val request = call.receive<UsuarioRequest>()
                    call.withAudit {
                        call.respond(HttpStatusCode.Created, service.criar(request, atual))
                    }
                }
            }
            put<Usuarios.Id> { resource ->
                call.handleUsuario {
                    val atual = call.principal<UsuarioAutenticado>()!!
                    val request = call.receive<UsuarioRequest>()
                    call.withAudit {
                        call.respond(service.atualizar(resource.id, request, atual))
                    }
                }
            }
            delete<Usuarios.Id> { resource ->
                call.handleUsuario {
                    val atual = call.principal<UsuarioAutenticado>()!!
                    call.withAudit {
                        service.excluir(resource.id, atual)
                        call.respond(HttpStatusCode.NoContent)
                    }
                }
            }
        }
    }
}

private suspend fun ApplicationCall.handleUsuario(block: suspend () -> Unit) {
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
