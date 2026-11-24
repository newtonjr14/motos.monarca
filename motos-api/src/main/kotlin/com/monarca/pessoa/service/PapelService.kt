package com.monarca.pessoa.service

import com.monarca.common.enums.Status
import com.monarca.empresa.service.EmpresaService
import com.monarca.localidade.service.RecursoNaoEncontrado
import com.monarca.localidade.service.acesso
import com.monarca.localidade.service.invalido
import com.monarca.pessoa.domain.FilialVinculo
import com.monarca.pessoa.domain.PapelCompleto
import com.monarca.pessoa.domain.Pessoa
import com.monarca.pessoa.dto.DocumentoConflitoResponse
import com.monarca.pessoa.dto.FilialVinculoResponse
import com.monarca.pessoa.dto.PapelRequest
import com.monarca.pessoa.dto.PapelResponse
import com.monarca.pessoa.dto.PessoaResumoResponse
import com.monarca.pessoa.dto.VinculoFilialConflitoResponse
import com.monarca.pessoa.repository.PessoaRepository
import com.monarca.usuario.repository.UsuarioRepository

class VinculoFilialConflito(
    val idPapel: Long,
    val pessoa: Pessoa,
    val filiaisVinculadas: List<FilialVinculo>,
    val idFilialAlvo: Long,
    val filialAlvoNome: String,
    message: String,
) : RuntimeException(message)

enum class TipoPapel { CLIENTE, FORNECEDOR }

class PapelService(
    private val repository: PessoaRepository,
    private val pessoaService: PessoaService,
    private val empresaService: EmpresaService,
    private val usuarioRepository: UsuarioRepository,
) {
    suspend fun listarClientes(idFilial: Long?, idUsuario: Long): List<PapelResponse> =
        listar(TipoPapel.CLIENTE, idFilial, idUsuario).map { it.toResponse() }

    suspend fun buscarCliente(id: Long): PapelResponse =
        repository.buscarCliente(id)?.toResponse()
            ?: throw RecursoNaoEncontrado("Cliente $id não encontrado")

    suspend fun criarCliente(request: PapelRequest, idUsuario: Long): PapelResponse =
        criarPapel(TipoPapel.CLIENTE, request, "cliente", idUsuario)

    suspend fun atualizarCliente(id: Long, request: PapelRequest): PapelResponse {
        val atual = repository.buscarCliente(id) ?: throw RecursoNaoEncontrado("Cliente $id não encontrado")
        atualizarPessoaSeInformada(atual.idPessoa, request)
        repository.atualizarCliente(id, validarStatus(request.status), normalizarObservacao(request.observacao))
        return buscarCliente(id)
    }

    suspend fun excluirCliente(id: Long, idFilial: Long?, idUsuario: Long) {
        exigirAcessoFilial(idUsuario, idFilial)
        if (!repository.excluirCliente(id, idFilial)) {
            throw RecursoNaoEncontrado("Cliente $id não encontrado")
        }
    }

    suspend fun contarClientes(): Long = repository.contarClientes()

    suspend fun listarFornecedores(idFilial: Long?, idUsuario: Long): List<PapelResponse> =
        listar(TipoPapel.FORNECEDOR, idFilial, idUsuario).map { it.toResponse() }

    suspend fun buscarFornecedor(id: Long): PapelResponse =
        repository.buscarFornecedor(id)?.toResponse()
            ?: throw RecursoNaoEncontrado("Fornecedor $id não encontrado")

    suspend fun criarFornecedor(request: PapelRequest, idUsuario: Long): PapelResponse =
        criarPapel(TipoPapel.FORNECEDOR, request, "fornecedor", idUsuario)

    suspend fun atualizarFornecedor(id: Long, request: PapelRequest): PapelResponse {
        val atual = repository.buscarFornecedor(id) ?: throw RecursoNaoEncontrado("Fornecedor $id não encontrado")
        atualizarPessoaSeInformada(atual.idPessoa, request)
        repository.atualizarFornecedor(id, validarStatus(request.status), normalizarObservacao(request.observacao))
        return buscarFornecedor(id)
    }

    suspend fun excluirFornecedor(id: Long, idFilial: Long?, idUsuario: Long) {
        exigirAcessoFilial(idUsuario, idFilial)
        if (!repository.excluirFornecedor(id, idFilial)) {
            throw RecursoNaoEncontrado("Fornecedor $id não encontrado")
        }
    }

    suspend fun contarFornecedores(): Long = repository.contarFornecedores()

    suspend fun enriquecerConflitoDocumento(e: DocumentoConflito, tipo: TipoPapel): DocumentoConflitoResponse {
        val papel = when (tipo) {
            TipoPapel.CLIENTE -> repository.buscarClientePorPessoa(e.pessoa.id)
            TipoPapel.FORNECEDOR -> repository.buscarFornecedorPorPessoa(e.pessoa.id)
        }
        return DocumentoConflitoResponse(
            codigo = e.codigo,
            message = e.message ?: "Documento em conflito",
            params = e.params,
            pessoa = e.pessoa.toResumo(),
            idPapel = papel?.id,
            filiaisVinculadas = papel?.filiaisVinculadas?.map { it.toResponse() }.orEmpty(),
        )
    }

    fun toVinculoFilialResponse(e: VinculoFilialConflito) = VinculoFilialConflitoResponse(
        codigo = "VINCULO_FILIAL",
        message = e.message ?: "Confirme o vínculo com a filial",
        idPapel = e.idPapel,
        pessoa = e.pessoa.toResumo(),
        filiaisVinculadas = e.filiaisVinculadas.map { it.toResponse() },
        idFilialAlvo = e.idFilialAlvo,
        filialAlvoNome = e.filialAlvoNome,
    )

    private suspend fun listar(tipo: TipoPapel, idFilial: Long?, idUsuario: Long): List<PapelCompleto> {
        val idFilialResolvida = resolverFilialComAcesso(idUsuario, idFilial)
        val filial = empresaService.buscarFilial(idFilialResolvida)
        val filtrar = when (tipo) {
            TipoPapel.CLIENTE -> filial.listarApenasClientesFilial
            TipoPapel.FORNECEDOR -> filial.listarApenasFornecedoresFilial
        }
        return when (tipo) {
            TipoPapel.CLIENTE -> repository.listarClientes(idFilialResolvida, filtrar)
            TipoPapel.FORNECEDOR -> repository.listarFornecedores(idFilialResolvida, filtrar)
        }
    }

    private suspend fun criarPapel(tipo: TipoPapel, request: PapelRequest, rotulo: String, idUsuario: Long): PapelResponse {
        val status = validarStatus(request.status)
        val observacao = normalizarObservacao(request.observacao)
        val idFilial = resolverFilialComAcesso(idUsuario, request.idFilialCadastro)
        val filialAlvo = empresaService.buscarFilial(idFilial)
        val idPessoa = garantirPessoa(request)
        val existente = when (tipo) {
            TipoPapel.CLIENTE -> repository.buscarClientePorPessoa(idPessoa)
            TipoPapel.FORNECEDOR -> repository.buscarFornecedorPorPessoa(idPessoa)
        }
        val id = when {
            existente == null -> inserirPapel(tipo, idPessoa, status, idFilial, observacao)
            existente.status == Status.DELETADO -> {
                reativarPapel(tipo, existente.id, status, observacao ?: existente.observacao)
                vincularFilial(tipo, existente.id, idFilial, request, rotulo, existente, filialAlvo.nome)
                existente.id
            }
            else -> {
                vincularFilial(tipo, existente.id, idFilial, request, rotulo, existente, filialAlvo.nome)
                if (observacao != null) {
                    gravarObservacao(tipo, existente.id, existente.status, observacao)
                }
                existente.id
            }
        }
        return buscar(tipo, id)
    }

    private suspend fun vincularFilial(
        tipo: TipoPapel,
        idPapel: Long,
        idFilial: Long,
        request: PapelRequest,
        rotulo: String,
        existente: PapelCompleto,
        filialAlvoNome: String,
    ) {
        val jaVinculado = when (tipo) {
            TipoPapel.CLIENTE -> repository.existeVinculoClienteFilial(idPapel, idFilial)
            TipoPapel.FORNECEDOR -> repository.existeVinculoFornecedorFilial(idPapel, idFilial)
        }
        if (jaVinculado) {
            throw invalido("PAPEL_JA_VINCULADO", "Esta pessoa já é $rotulo nesta filial")
        }
        val filiaisOutras = existente.filiaisVinculadas.filter { it.id != idFilial }
        if (filiaisOutras.isNotEmpty() && !request.confirmarVinculoFilial) {
            throw VinculoFilialConflito(
                idPapel = idPapel,
                pessoa = existente.pessoa.pessoa,
                filiaisVinculadas = existente.filiaisVinculadas,
                idFilialAlvo = idFilial,
                filialAlvoNome = filialAlvoNome,
                message = "Cadastro existente em outra filial. Confirme o vínculo.",
            )
        }
        when (tipo) {
            TipoPapel.CLIENTE -> repository.vincularClienteFilial(idPapel, idFilial)
            TipoPapel.FORNECEDOR -> repository.vincularFornecedorFilial(idPapel, idFilial)
        }
    }

    private suspend fun inserirPapel(
        tipo: TipoPapel,
        idPessoa: Long,
        status: Status,
        idFilial: Long,
        observacao: String?,
    ): Long = when (tipo) {
        TipoPapel.CLIENTE -> repository.inserirCliente(idPessoa, status, idFilial, observacao)
        TipoPapel.FORNECEDOR -> repository.inserirFornecedor(idPessoa, status, idFilial, observacao)
    }

    private suspend fun reativarPapel(tipo: TipoPapel, id: Long, status: Status, observacao: String?) {
        gravarObservacao(tipo, id, status, observacao)
    }

    private suspend fun gravarObservacao(tipo: TipoPapel, id: Long, status: Status, observacao: String?) {
        when (tipo) {
            TipoPapel.CLIENTE -> repository.atualizarCliente(id, status, observacao)
            TipoPapel.FORNECEDOR -> repository.atualizarFornecedor(id, status, observacao)
        }
    }

    private fun normalizarObservacao(valor: String?): String? {
        val texto = valor?.trim()?.ifBlank { null } ?: return null
        if (texto.length > 500) {
            throw invalido("OBSERVACAO_TAMANHO", "A observação deve ter no máximo 500 caracteres")
        }
        return texto
    }

    private suspend fun buscar(tipo: TipoPapel, id: Long): PapelResponse = when (tipo) {
        TipoPapel.CLIENTE -> buscarCliente(id)
        TipoPapel.FORNECEDOR -> buscarFornecedor(id)
    }

    private suspend fun garantirPessoa(request: PapelRequest): Long {
        val idInformado = request.idPessoa
        val pessoaReq = request.pessoa
        if (idInformado != null && pessoaReq != null) {
            throw invalido("PESSOA_XOR", "Informe a pessoa ou o idPessoa, não os dois")
        }
        if (idInformado != null) {
            pessoaService.buscar(idInformado)
            return idInformado
        }
        if (pessoaReq != null) {
            return pessoaService.criar(pessoaReq).id
        }
        throw invalido("PESSOA_OBRIGATORIA", "Informe a pessoa ou o idPessoa")
    }

    private suspend fun atualizarPessoaSeInformada(idPessoa: Long, request: PapelRequest) {
        request.pessoa?.let { pessoaService.atualizar(idPessoa, it) }
    }

    private fun validarStatus(status: Status): Status {
        if (status == Status.DELETADO) {
            throw invalido("USE_DELETE", "Use DELETE para marcar como deletado")
        }
        return status
    }

    private suspend fun resolverFilialComAcesso(idUsuario: Long, idFilial: Long?): Long {
        val resolvida = empresaService.resolverFilialCadastro(idFilial)
        exigirAcessoFilial(idUsuario, resolvida)
        return resolvida
    }

    private suspend fun exigirAcessoFilial(idUsuario: Long, idFilial: Long?) {
        val resolvida = idFilial ?: empresaService.buscarFilialPrincipal().id
        if (!usuarioRepository.temAcessoFilial(idUsuario, resolvida)) {
            throw acesso("SEM_ACESSO_FILIAL", "Sem acesso à filial")
        }
    }

    private fun PapelCompleto.toResponse() = PapelResponse(
        id = id,
        idPessoa = idPessoa,
        idFilialCadastro = idFilialCadastro,
        filialNome = filialNome,
        filiaisVinculadas = filiaisVinculadas.map { it.toResponse() },
        status = status,
        observacao = observacao,
        pessoa = pessoaService.asResponse(pessoa),
    )

    private fun FilialVinculo.toResponse() = FilialVinculoResponse(id = id, nome = nome)

    private fun Pessoa.toResumo() = PessoaResumoResponse(
        id = id,
        nomeRazaoSocial = nomeRazaoSocial,
        tipoPessoa = tipoPessoa,
    )
}
