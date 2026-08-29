package com.monarca.pessoa.service

import com.monarca.common.enums.Status
import com.monarca.localidade.service.RecursoNaoEncontrado
import com.monarca.localidade.service.RequisicaoInvalida
import com.monarca.pessoa.domain.PapelCompleto
import com.monarca.pessoa.dto.PapelRequest
import com.monarca.pessoa.dto.PapelResponse
import com.monarca.pessoa.repository.PessoaRepository

class PapelService(
    private val repository: PessoaRepository,
    private val pessoaService: PessoaService,
) {

    suspend fun listarClientes(): List<PapelResponse> = repository.listarClientes().map { it.toResponse() }

    suspend fun buscarCliente(id: Long): PapelResponse =
        repository.buscarCliente(id)?.toResponse()
            ?: throw RecursoNaoEncontrado("Cliente $id não encontrado")

    suspend fun criarCliente(request: PapelRequest): PapelResponse =
        criarPapel(
            request = request,
            rotulo = "cliente",
            buscarPorPessoa = { repository.buscarClientePorPessoa(it) },
            inserir = { idPessoa, status -> repository.inserirCliente(idPessoa, status) },
            atualizar = { id, status -> repository.atualizarCliente(id, status) },
            buscar = { repository.buscarCliente(it) },
        )

    suspend fun atualizarCliente(id: Long, request: PapelRequest): PapelResponse {
        val atual = repository.buscarCliente(id) ?: throw RecursoNaoEncontrado("Cliente $id não encontrado")
        atualizarPessoaSeInformada(atual.idPessoa, request)
        repository.atualizarCliente(id, validarStatus(request.status))
        return buscarCliente(id)
    }

    suspend fun excluirCliente(id: Long) {
        if (!repository.excluirCliente(id)) {
            throw RecursoNaoEncontrado("Cliente $id não encontrado")
        }
    }

    suspend fun contarClientes(): Long = repository.contarClientes()

    suspend fun listarFornecedores(): List<PapelResponse> = repository.listarFornecedores().map { it.toResponse() }

    suspend fun buscarFornecedor(id: Long): PapelResponse =
        repository.buscarFornecedor(id)?.toResponse()
            ?: throw RecursoNaoEncontrado("Fornecedor $id não encontrado")

    suspend fun criarFornecedor(request: PapelRequest): PapelResponse =
        criarPapel(
            request = request,
            rotulo = "fornecedor",
            buscarPorPessoa = { repository.buscarFornecedorPorPessoa(it) },
            inserir = { idPessoa, status -> repository.inserirFornecedor(idPessoa, status) },
            atualizar = { id, status -> repository.atualizarFornecedor(id, status) },
            buscar = { repository.buscarFornecedor(it) },
        )

    suspend fun atualizarFornecedor(id: Long, request: PapelRequest): PapelResponse {
        val atual = repository.buscarFornecedor(id) ?: throw RecursoNaoEncontrado("Fornecedor $id não encontrado")
        atualizarPessoaSeInformada(atual.idPessoa, request)
        repository.atualizarFornecedor(id, validarStatus(request.status))
        return buscarFornecedor(id)
    }

    suspend fun excluirFornecedor(id: Long) {
        if (!repository.excluirFornecedor(id)) {
            throw RecursoNaoEncontrado("Fornecedor $id não encontrado")
        }
    }

    suspend fun contarFornecedores(): Long = repository.contarFornecedores()

    private suspend fun criarPapel(
        request: PapelRequest,
        rotulo: String,
        buscarPorPessoa: suspend (Long) -> PapelCompleto?,
        inserir: suspend (Long, Status) -> Long,
        atualizar: suspend (Long, Status) -> Boolean,
        buscar: suspend (Long) -> PapelCompleto?,
    ): PapelResponse {
        val status = validarStatus(request.status)
        val idPessoa = garantirPessoa(request)
        val existente = buscarPorPessoa(idPessoa)
        val id = when {
            existente == null -> inserir(idPessoa, status)
            existente.status == Status.DELETADO -> {
                atualizar(existente.id, status)
                existente.id
            }
            else -> throw RequisicaoInvalida("Esta pessoa já é $rotulo")
        }
        return buscar(id)?.toResponse() ?: throw RecursoNaoEncontrado("${rotulo.replaceFirstChar { it.uppercase() }} $id não encontrado")
    }

    private suspend fun garantirPessoa(request: PapelRequest): Long {
        val idInformado = request.idPessoa
        val pessoaReq = request.pessoa
        if (idInformado != null && pessoaReq != null) {
            throw RequisicaoInvalida("Informe a pessoa ou o idPessoa, não os dois")
        }
        if (idInformado != null) {
            pessoaService.buscar(idInformado)
            return idInformado
        }
        if (pessoaReq != null) {
            return pessoaService.criar(pessoaReq).id
        }
        throw RequisicaoInvalida("Informe a pessoa ou o idPessoa")
    }

    private suspend fun atualizarPessoaSeInformada(idPessoa: Long, request: PapelRequest) {
        request.pessoa?.let { pessoaService.atualizar(idPessoa, it) }
    }

    private fun validarStatus(status: Status): Status {
        if (status == Status.DELETADO) {
            throw RequisicaoInvalida("Use DELETE para marcar como deletado")
        }
        return status
    }

    private fun PapelCompleto.toResponse() = PapelResponse(
        id = id,
        idPessoa = idPessoa,
        status = status,
        pessoa = pessoaService.asResponse(pessoa),
    )
}
