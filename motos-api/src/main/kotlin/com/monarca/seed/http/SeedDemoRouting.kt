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
import com.monarca.seed.service.DemoSeedService
import io.ktor.http.HttpStatusCode
import io.ktor.server.application.Application
import io.ktor.server.application.ApplicationCall
import io.ktor.server.application.ApplicationStarted
import io.ktor.server.application.log
import io.ktor.server.auth.authenticate
import io.ktor.server.response.respond
import io.ktor.server.resources.delete
import io.ktor.server.resources.get
import io.ktor.server.resources.post
import io.ktor.server.routing.routing
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.TimeoutCancellationException
import kotlinx.coroutines.launch
import org.koin.ktor.ext.get as koinGet

fun Application.configureSeed() {
    val service = koinGet<DemoSeedService>()
    val auto = environment.config.propertyOrNull("seed.demo")?.getString()?.toBooleanStrictOrNull() == true

    routing {
        authenticate(JWT_AUTH) {
            get<SeedDemo> {
                call.handleSeed {
                    call.podeGerenciarEmpresa()
                    call.respond(service.status())
                }
            }
            post<SeedDemo> {
                call.handleSeed {
                    call.podeGerenciarEmpresa()
                    call.withAudit {
                        val status = service.aplicar()
                        call.respond(HttpStatusCode.OK, status)
                    }
                }
            }
            delete<SeedDemo> {
                call.handleSeed {
                    call.podeGerenciarEmpresa()
                    call.withAudit {
                        call.respond(service.remover())
                    }
                }
            }
        }
    }

    if (!auto) {
        log.info("Seed DEMO desligado (seed.demo=false). Ligue em Cadastros → Empresa ou seed.demo: true")
        return
    }

    log.info("Seed DEMO ligado — aplica depois da API subir")
    monitor.subscribe(ApplicationStarted) {
        CoroutineScope(Dispatchers.Default).launch {
            try {
                log.info("Seed DEMO aplicando dados de teste")
                val status = service.aplicar()
                log.info(
                    "Seed DEMO aplicado: clientes=${status.clientes} produtos=${status.produtos} vendas=${status.vendas}",
                )
            } catch (e: TimeoutCancellationException) {
                log.error("Seed DEMO estourou o tempo ao aplicar", e)
            } catch (e: Exception) {
                log.error("Seed DEMO falhou ao aplicar", e)
            }
        }
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
