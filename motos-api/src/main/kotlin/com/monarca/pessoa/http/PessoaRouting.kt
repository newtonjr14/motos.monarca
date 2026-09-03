package com.monarca.pessoa.http

import com.monarca.auth.JWT_AUTH
import com.monarca.auth.podeConsultarPessoa
import com.monarca.auth.podeGerenciarDocumento
import com.monarca.auth.podeGerenciarPessoa
import com.monarca.auth.usuarioAutenticado
import com.monarca.auth.withAudit
import com.monarca.common.http.respondBadRequest
import com.monarca.common.http.respondForbidden
import com.monarca.common.http.respondNotFound
import com.monarca.localidade.service.AcessoNegado
import com.monarca.localidade.service.RecursoNaoEncontrado
import com.monarca.localidade.service.RequisicaoInvalida
import com.monarca.pessoa.dto.DocumentoTipoRequest
import com.monarca.pessoa.dto.PapelRequest
import com.monarca.pessoa.dto.PessoaRequest
import com.monarca.pessoa.service.DocumentoConflito
import com.monarca.pessoa.service.TipoPapel
import com.monarca.pessoa.service.VinculoFilialConflito
import com.monarca.pessoa.service.PapelService
import com.monarca.pessoa.service.PessoaService
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

suspend fun Application.configurePessoa() {
    val service = koinGet<PessoaService>()
    val papel = koinGet<PapelService>()
    service.init()

    routing {
        authenticate(JWT_AUTH) {
            get<DocumentosTipos> { resource ->
                call.handlePessoa(service, papel) {
                    call.podeConsultarPessoa()
                    call.respond(service.listarTipos(resource.idPais, resource.tipoPessoa))
                }
            }
            get<DocumentosTipos.Id> { resource ->
                call.handlePessoa(service, papel) {
                    call.podeConsultarPessoa()
                    call.respond(service.buscarTipo(resource.id))
                }
            }
            post<DocumentosTipos> {
                call.handlePessoa(service, papel) {
                    call.podeGerenciarDocumento()
                    val request = call.receive<DocumentoTipoRequest>()
                    call.withAudit {
                        call.respond(HttpStatusCode.Created, service.criarTipo(request))
                    }
                }
            }
            put<DocumentosTipos.Id> { resource ->
                call.handlePessoa(service, papel) {
                    call.podeGerenciarDocumento()
                    val request = call.receive<DocumentoTipoRequest>()
                    call.withAudit {
                        call.respond(service.atualizarTipo(resource.id, request))
                    }
                }
            }
            delete<DocumentosTipos.Id> { resource ->
                call.handlePessoa(service, papel) {
                    call.podeGerenciarDocumento()
                    call.withAudit {
                        service.excluirTipo(resource.id)
                        call.respond(HttpStatusCode.NoContent)
                    }
                }
            }
            get<Pessoas> {
                call.handlePessoa(service, papel) {
                    call.podeConsultarPessoa()
                    call.respond(service.listar())
                }
            }
            get<Pessoas.Id> { resource ->
                call.handlePessoa(service, papel) {
                    call.podeConsultarPessoa()
                    call.respond(service.buscar(resource.id))
                }
            }
            post<Pessoas> {
                call.handlePessoa(service, papel) {
                    call.podeGerenciarPessoa()
                    val request = call.receive<PessoaRequest>()
                    call.withAudit {
                        call.respond(HttpStatusCode.Created, service.criar(request))
                    }
                }
            }
            put<Pessoas.Id> { resource ->
                call.handlePessoa(service, papel) {
                    call.podeGerenciarPessoa()
                    val request = call.receive<PessoaRequest>()
                    call.withAudit {
                        call.respond(service.atualizar(resource.id, request))
                    }
                }
            }
            delete<Pessoas.Id> { resource ->
                call.handlePessoa(service, papel) {
                    call.podeGerenciarPessoa()
                    call.withAudit {
                        service.excluir(resource.id)
                        call.respond(HttpStatusCode.NoContent)
                    }
                }
            }

            get<Clientes> { resource ->
                call.handlePessoa(service, papel, TipoPapel.CLIENTE) {
                    call.podeConsultarPessoa()
                    call.respond(papel.listarClientes(resource.idFilial, call.usuarioAutenticado().id))
                }
            }
            get<Clientes.Id> { resource ->
                call.handlePessoa(service, papel, TipoPapel.CLIENTE) {
                    call.podeConsultarPessoa()
                    call.respond(papel.buscarCliente(resource.id))
                }
            }
            post<Clientes> {
                call.handlePessoa(service, papel, TipoPapel.CLIENTE) {
                    call.podeGerenciarPessoa()
                    val request = call.receive<PapelRequest>()
                    call.withAudit {
                        call.respond(HttpStatusCode.Created, papel.criarCliente(request, call.usuarioAutenticado().id))
                    }
                }
            }
            put<Clientes.Id> { resource ->
                call.handlePessoa(service, papel, TipoPapel.CLIENTE) {
                    call.podeGerenciarPessoa()
                    val request = call.receive<PapelRequest>()
                    call.withAudit {
                        call.respond(papel.atualizarCliente(resource.id, request))
                    }
                }
            }
            delete<Clientes.Id> { resource ->
                call.handlePessoa(service, papel, TipoPapel.CLIENTE) {
                    call.podeGerenciarPessoa()
                    val idFilial = call.request.queryParameters["idFilial"]?.toLongOrNull()
                    call.withAudit {
                        papel.excluirCliente(resource.id, idFilial, call.usuarioAutenticado().id)
                        call.respond(HttpStatusCode.NoContent)
                    }
                }
            }

            get<Fornecedores> { resource ->
                call.handlePessoa(service, papel, TipoPapel.FORNECEDOR) {
                    call.podeConsultarPessoa()
                    call.respond(papel.listarFornecedores(resource.idFilial, call.usuarioAutenticado().id))
                }
            }
            get<Fornecedores.Id> { resource ->
                call.handlePessoa(service, papel, TipoPapel.FORNECEDOR) {
                    call.podeConsultarPessoa()
                    call.respond(papel.buscarFornecedor(resource.id))
                }
            }
            post<Fornecedores> {
                call.handlePessoa(service, papel, TipoPapel.FORNECEDOR) {
                    call.podeGerenciarPessoa()
                    val request = call.receive<PapelRequest>()
                    call.withAudit {
                        call.respond(HttpStatusCode.Created, papel.criarFornecedor(request, call.usuarioAutenticado().id))
                    }
                }
            }
            put<Fornecedores.Id> { resource ->
                call.handlePessoa(service, papel, TipoPapel.FORNECEDOR) {
                    call.podeGerenciarPessoa()
                    val request = call.receive<PapelRequest>()
                    call.withAudit {
                        call.respond(papel.atualizarFornecedor(resource.id, request))
                    }
                }
            }
            delete<Fornecedores.Id> { resource ->
                call.handlePessoa(service, papel, TipoPapel.FORNECEDOR) {
                    call.podeGerenciarPessoa()
                    val idFilial = call.request.queryParameters["idFilial"]?.toLongOrNull()
                    call.withAudit {
                        papel.excluirFornecedor(resource.id, idFilial, call.usuarioAutenticado().id)
                        call.respond(HttpStatusCode.NoContent)
                    }
                }
            }
        }
    }
}

private suspend fun ApplicationCall.handlePessoa(
    service: PessoaService,
    papel: PapelService,
    tipoPapel: TipoPapel? = null,
    block: suspend () -> Unit,
) {
    try {
        block()
    } catch (e: RecursoNaoEncontrado) {
        respondNotFound(e)
    } catch (e: RequisicaoInvalida) {
        respondBadRequest(e)
    } catch (e: AcessoNegado) {
        respondForbidden(e)
    } catch (e: DocumentoConflito) {
        val body = if (tipoPapel != null) {
            papel.enriquecerConflitoDocumento(e, tipoPapel)
        } else {
            service.toConflitoResponse(e)
        }
        respond(HttpStatusCode.Conflict, body)
    } catch (e: VinculoFilialConflito) {
        respond(HttpStatusCode.Conflict, papel.toVinculoFilialResponse(e))
    }
}
