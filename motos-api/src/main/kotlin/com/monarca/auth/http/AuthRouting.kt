package com.monarca.auth.http

import com.monarca.auth.JWT_AUTH
import com.monarca.auth.domain.UsuarioAutenticado
import com.monarca.auth.dto.AlterarSenhaRequest
import com.monarca.auth.dto.EditarPerfilRequest
import com.monarca.auth.dto.LoginRequest
import com.monarca.auth.dto.RefreshRequest
import com.monarca.auth.service.AuthService
import com.monarca.common.http.respondBadRequest
import com.monarca.common.http.respondNotFound
import com.monarca.localidade.service.RecursoNaoEncontrado
import com.monarca.localidade.service.RequisicaoInvalida
import com.monarca.localidade.service.invalido
import io.ktor.http.HttpStatusCode
import io.ktor.server.application.Application
import io.ktor.server.application.ApplicationCall
import io.ktor.server.auth.authenticate
import io.ktor.server.auth.principal
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.resources.get
import io.ktor.server.resources.post
import io.ktor.server.resources.put
import io.ktor.server.routing.routing
import org.koin.ktor.ext.get as koinGet

suspend fun Application.configureAuthRoutes() {
    val service = koinGet<AuthService>()

    routing {
        post<AuthLogin> {
            call.handleAuth {
                val request = call.receive<LoginRequest>()
                call.respond(service.login(request))
            }
        }
        post<AuthRefresh> {
            call.handleAuth {
                val request = call.receive<RefreshRequest>()
                call.respond(service.refresh(request.refreshToken))
            }
        }
        post<AuthLogout> {
            call.handleAuth {
                val request = runCatching { call.receive<RefreshRequest>() }.getOrNull()
                service.logout(request?.refreshToken)
                call.respond(HttpStatusCode.NoContent)
            }
        }

        authenticate(JWT_AUTH) {
            get<AuthMe> {
                call.handleAuth {
                    val usuario = call.principal<UsuarioAutenticado>()
                        ?: throw invalido("NAO_AUTENTICADO", "Não autenticado")
                    call.respond(service.perfil(usuario.id))
                }
            }
            put<AuthSenha> {
                call.handleAuth {
                    val usuario = call.principal<UsuarioAutenticado>()
                        ?: throw invalido("NAO_AUTENTICADO", "Não autenticado")
                    val request = call.receive<AlterarSenhaRequest>()
                    service.alterarSenha(usuario.id, request)
                    call.respond(HttpStatusCode.NoContent)
                }
            }
            put<AuthPerfil> {
                call.handleAuth {
                    val usuario = call.principal<UsuarioAutenticado>()
                        ?: throw invalido("NAO_AUTENTICADO", "Não autenticado")
                    val request = call.receive<EditarPerfilRequest>()
                    service.editarPerfil(usuario.id, request)
                    call.respond(service.perfil(usuario.id))
                }
            }
        }
    }
}

private suspend fun ApplicationCall.handleAuth(block: suspend () -> Unit) {
    try {
        block()
    } catch (e: RecursoNaoEncontrado) {
        respondNotFound(e)
    } catch (e: RequisicaoInvalida) {
        respondBadRequest(e)
    }
}
