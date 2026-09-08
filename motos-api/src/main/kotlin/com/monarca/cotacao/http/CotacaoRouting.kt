package com.monarca.cotacao.http

import com.monarca.auth.JWT_AUTH
import com.monarca.auth.domain.UsuarioAutenticado
import com.monarca.auth.podeConsultarCotacao
import com.monarca.auth.podeGerenciarCotacao
import com.monarca.auth.withAudit
import com.monarca.common.dto.MensagemErro
import com.monarca.common.http.respondBadRequest
import com.monarca.common.http.respondForbidden
import com.monarca.common.http.respondNotFound
import com.monarca.cotacao.dto.CotacaoRequest
import com.monarca.cotacao.service.CotacaoService
import com.monarca.localidade.service.AcessoNegado
import com.monarca.localidade.service.RecursoNaoEncontrado
import com.monarca.localidade.service.RequisicaoInvalida
import io.ktor.http.HttpStatusCode
import io.ktor.server.application.Application
import io.ktor.server.application.ApplicationCall
import io.ktor.server.application.createApplicationPlugin
import io.ktor.server.application.install
import io.ktor.server.auth.AuthenticationChecked
import io.ktor.server.auth.authenticate
import io.ktor.server.auth.principal
import io.ktor.server.request.path
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.resources.delete
import io.ktor.server.resources.get
import io.ktor.server.resources.post
import io.ktor.server.resources.put
import io.ktor.server.routing.routing
import org.koin.ktor.ext.get as koinGet

fun Application.configureCotacao() {
    val service = koinGet<CotacaoService>()
    val exigirDoDia = environment.config.propertyOrNull("cotacao.exigirDoDia")
        ?.getString()
        ?.toBooleanStrictOrNull()
        ?: true

    install(
        createApplicationPlugin("CotacaoGuard") {
            on(AuthenticationChecked) { call ->
                if (!exigirDoDia) return@on
                if (call.principal<UsuarioAutenticado>() == null) return@on
                if (!pathExigeCotacaoDoDia(call.request.path())) return@on
                if (!service.temHoje()) {
                    call.respond(
                        HttpStatusCode.Forbidden,
                        MensagemErro(
                            "COTACAO_DIA_AUSENTE",
                            "Informe a cotação do dia para vender, receber, pagar ou emitir factura",
                        ),
                    )
                }
            }
        },
    )

    routing {
        authenticate(JWT_AUTH) {
            get<Cotacoes> {
                call.handleCotacao {
                    call.podeConsultarCotacao()
                    call.respond(service.listar())
                }
            }
            get<Cotacoes.Hoje> {
                call.handleCotacao {
                    call.podeConsultarCotacao()
                    call.respond(service.buscarHoje())
                }
            }
            get<Cotacoes.Id> { resource ->
                call.handleCotacao {
                    call.podeConsultarCotacao()
                    call.respond(service.buscar(resource.id))
                }
            }
            post<Cotacoes> {
                call.handleCotacao {
                    call.podeGerenciarCotacao()
                    val request = call.receive<CotacaoRequest>()
                    call.withAudit {
                        call.respond(HttpStatusCode.Created, service.criar(request))
                    }
                }
            }
            put<Cotacoes.Id> { resource ->
                call.handleCotacao {
                    call.podeGerenciarCotacao()
                    val request = call.receive<CotacaoRequest>()
                    call.withAudit {
                        call.respond(service.atualizar(resource.id, request))
                    }
                }
            }
            delete<Cotacoes.Id> { resource ->
                call.handleCotacao {
                    call.podeGerenciarCotacao()
                    call.withAudit {
                        service.excluir(resource.id)
                        call.respond(HttpStatusCode.NoContent)
                    }
                }
            }
        }
    }
}

internal fun pathExigeCotacaoDoDia(path: String): Boolean =
    OPERACOES_COM_COTACAO.any { path == it || path.startsWith("$it/") }

private val OPERACOES_COM_COTACAO = listOf(
    "/vendas",
    "/recebimentos",
    "/pagamentos",
    "/facturas",
    "/nfe",
    "/nfes",
)

private suspend fun ApplicationCall.handleCotacao(block: suspend () -> Unit) {
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
