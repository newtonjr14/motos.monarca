package com.monarca.seed.http

import com.monarca.auth.JWT_AUTH
import com.monarca.auth.podeGerenciarEmpresa
import com.monarca.auth.withAudit
import com.monarca.common.http.respondBadRequest
import com.monarca.common.http.respondForbidden
import com.monarca.common.http.respondNotFound
import com.monarca.localidade.service.AcessoNegado
import com.monarca.localidade.service.RecursoNaoEncontrado
import com.monarca.localidade.service.RequisicaoInvalida
import com.monarca.seed.dto.SeedDemoStatusResponse
import com.monarca.seed.service.DemoSeedService
import io.ktor.http.HttpStatusCode
import io.ktor.server.application.Application
import io.ktor.server.application.ApplicationCall
import io.ktor.server.application.log
import io.ktor.server.auth.authenticate
import io.ktor.server.response.respond
import io.ktor.server.resources.delete
import io.ktor.server.resources.get
import io.ktor.server.resources.post
import io.ktor.server.routing.routing
import kotlinx.coroutines.TimeoutCancellationException
import org.koin.ktor.ext.get as koinGet

fun Application.configureSeed() {
    val service = koinGet<DemoSeedService>()
    val habilitado = environment.config.propertyOrNull("seed.demo")
        ?.getString()
        ?.toBooleanStrictOrNull() == true

    if (habilitado) {
        log.info("Seed DEMO habilitado (seed.demo=true). Ligar e desligar em Cadastros → Empresa")
    } else {
        log.info("Seed DEMO desligado (seed.demo=false). Sem botão e sem API de dados de teste")
    }

    routing {
        authenticate(JWT_AUTH) {
            get<SeedDemo> {
                call.handleSeed {
                    call.podeGerenciarEmpresa()
                    if (!habilitado) {
                        call.respond(SeedDemoStatusResponse(habilitado = false, aplicado = false))
                    } else {
                        call.respond(service.status())
                    }
                }
            }
            post<SeedDemo> {
                call.handleSeed {
                    call.podeGerenciarEmpresa()
                    call.exigirSeedHabilitado(habilitado)
                    call.withAudit {
                        call.respond(HttpStatusCode.OK, service.aplicar())
                    }
                }
            }
            delete<SeedDemo> {
                call.handleSeed {
                    call.podeGerenciarEmpresa()
                    call.exigirSeedHabilitado(habilitado)
                    call.withAudit {
                        call.respond(service.remover())
                    }
                }
            }
        }
    }
}

private fun ApplicationCall.exigirSeedHabilitado(habilitado: Boolean) {
    if (!habilitado) {
        throw RecursoNaoEncontrado("Dados de teste desligados", "SEED_DESLIGADO")
    }
}

private suspend fun ApplicationCall.handleSeed(block: suspend () -> Unit) {
    try {
        block()
    } catch (e: RecursoNaoEncontrado) {
        respondNotFound(e)
    } catch (e: RequisicaoInvalida) {
        respondBadRequest(e)
    } catch (e: AcessoNegado) {
        respondForbidden(e)
    } catch (e: TimeoutCancellationException) {
        application.log.error("Seed DEMO estourou o tempo", e)
        throw e
    } catch (e: Exception) {
        application.log.error("Seed DEMO falhou", e)
        throw e
    }
}
