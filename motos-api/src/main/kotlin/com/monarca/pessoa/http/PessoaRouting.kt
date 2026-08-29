package com.monarca.pessoa.http

import com.monarca.auth.JWT_AUTH
import com.monarca.auth.podeConsultarPessoa
import com.monarca.auth.podeGerenciarPessoa
import com.monarca.auth.withAudit
import com.monarca.localidade.service.AcessoNegado
import com.monarca.localidade.service.RecursoNaoEncontrado
import com.monarca.localidade.service.RequisicaoInvalida
import com.monarca.pessoa.dto.DocumentoTipoRequest
import com.monarca.pessoa.dto.MensagemErro
import com.monarca.pessoa.dto.PapelRequest
import com.monarca.pessoa.dto.PessoaRequest
import com.monarca.pessoa.service.DocumentoConflito
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
                call.handlePessoa(service) {
                    call.podeConsultarPessoa()
                    call.respond(service.listarTipos(resource.idPais, resource.tipoPessoa))
                }
            }
            get<DocumentosTipos.Id> { resource ->
                call.handlePessoa(service) {
                    call.podeConsultarPessoa()
                    call.respond(service.buscarTipo(resource.id))
                }
            }
            post<DocumentosTipos> {
                call.handlePessoa(service) {
                    call.podeGerenciarPessoa()
                    val request = call.receive<DocumentoTipoRequest>()
                    call.withAudit {
                        call.respond(HttpStatusCode.Created, service.criarTipo(request))
                    }
                }
            }
            put<DocumentosTipos.Id> { resource ->
                call.handlePessoa(service) {
                    call.podeGerenciarPessoa()
                    val request = call.receive<DocumentoTipoRequest>()
                    call.withAudit {
                        call.respond(service.atualizarTipo(resource.id, request))
                    }
                }
            }
            delete<DocumentosTipos.Id> { resource ->
                call.handlePessoa(service) {
                    call.podeGerenciarPessoa()
                    call.withAudit {
                        service.excluirTipo(resource.id)
                        call.respond(HttpStatusCode.NoContent)
                    }
                }
            }
            get<Pessoas> {
                call.handlePessoa(service) {
                    call.podeConsultarPessoa()
                    call.respond(service.listar())
                }
            }
            get<Pessoas.Id> { resource ->
                call.handlePessoa(service) {
                    call.podeConsultarPessoa()
                    call.respond(service.buscar(resource.id))
                }
            }
            post<Pessoas> {
                call.handlePessoa(service) {
                    call.podeGerenciarPessoa()
                    val request = call.receive<PessoaRequest>()
                    call.withAudit {
                        call.respond(HttpStatusCode.Created, service.criar(request))
                    }
                }
            }
            put<Pessoas.Id> { resource ->
                call.handlePessoa(service) {
                    call.podeGerenciarPessoa()
                    val request = call.receive<PessoaRequest>()
                    call.withAudit {
                        call.respond(service.atualizar(resource.id, request))
                    }
                }
            }
            delete<Pessoas.Id> { resource ->
                call.handlePessoa(service) {
                    call.podeGerenciarPessoa()
                    call.withAudit {
                        service.excluir(resource.id)
                        call.respond(HttpStatusCode.NoContent)
                    }
                }
            }

            get<Clientes> {
                call.handlePessoa(service) {
                    call.podeConsultarPessoa()
                    call.respond(papel.listarClientes())
                }
            }
            get<Clientes.Id> { resource ->
                call.handlePessoa(service) {
                    call.podeConsultarPessoa()
                    call.respond(papel.buscarCliente(resource.id))
                }
            }
            post<Clientes> {
                call.handlePessoa(service) {
                    call.podeGerenciarPessoa()
                    val request = call.receive<PapelRequest>()
                    call.withAudit {
                        call.respond(HttpStatusCode.Created, papel.criarCliente(request))
                    }
                }
            }
            put<Clientes.Id> { resource ->
                call.handlePessoa(service) {
                    call.podeGerenciarPessoa()
                    val request = call.receive<PapelRequest>()
                    call.withAudit {
                        call.respond(papel.atualizarCliente(resource.id, request))
                    }
                }
            }
            delete<Clientes.Id> { resource ->
                call.handlePessoa(service) {
                    call.podeGerenciarPessoa()
                    call.withAudit {
                        papel.excluirCliente(resource.id)
                        call.respond(HttpStatusCode.NoContent)
                    }
                }
            }

            get<Fornecedores> {
                call.handlePessoa(service) {
                    call.podeConsultarPessoa()
                    call.respond(papel.listarFornecedores())
                }
            }
            get<Fornecedores.Id> { resource ->
                call.handlePessoa(service) {
                    call.podeConsultarPessoa()
                    call.respond(papel.buscarFornecedor(resource.id))
                }
            }
            post<Fornecedores> {
                call.handlePessoa(service) {
                    call.podeGerenciarPessoa()
                    val request = call.receive<PapelRequest>()
                    call.withAudit {
                        call.respond(HttpStatusCode.Created, papel.criarFornecedor(request))
                    }
                }
            }
            put<Fornecedores.Id> { resource ->
                call.handlePessoa(service) {
                    call.podeGerenciarPessoa()
                    val request = call.receive<PapelRequest>()
                    call.withAudit {
                        call.respond(papel.atualizarFornecedor(resource.id, request))
                    }
                }
            }
            delete<Fornecedores.Id> { resource ->
                call.handlePessoa(service) {
                    call.podeGerenciarPessoa()
                    call.withAudit {
                        papel.excluirFornecedor(resource.id)
                        call.respond(HttpStatusCode.NoContent)
                    }
                }
            }
        }
    }
}

private suspend fun ApplicationCall.handlePessoa(service: PessoaService, block: suspend () -> Unit) {
    try {
        block()
    } catch (e: RecursoNaoEncontrado) {
        respond(HttpStatusCode.NotFound, MensagemErro(e.message ?: "Não encontrado"))
    } catch (e: RequisicaoInvalida) {
        respond(HttpStatusCode.BadRequest, MensagemErro(e.message ?: "Requisição inválida"))
    } catch (e: AcessoNegado) {
        respond(HttpStatusCode.Forbidden, MensagemErro(e.message ?: "Acesso negado"))
    } catch (e: DocumentoConflito) {
        respond(HttpStatusCode.Conflict, service.toConflitoResponse(e))
    }
}
