package com.monarca.localidade.service

import com.monarca.Texto
import com.monarca.localidade.domain.CidadeDetalhe
import com.monarca.localidade.domain.Divisao
import com.monarca.localidade.domain.Pais
import com.monarca.common.enums.Status
import com.monarca.localidade.dto.CidadeRequest
import com.monarca.localidade.dto.CidadeResponse
import com.monarca.localidade.dto.DivisaoRequest
import com.monarca.localidade.dto.DivisaoResponse
import com.monarca.localidade.dto.PaisRequest
import com.monarca.localidade.dto.PaisResponse
import com.monarca.localidade.repository.LocalidadeRepository

class LocalidadeService(
    private val repository: LocalidadeRepository,
) {

    suspend fun init() = repository.inicializar()

    suspend fun listarPaises(): List<PaisResponse> =
        repository.listarPaises().map { it.toResponse() }

    suspend fun buscarPais(id: Long): PaisResponse =
        repository.buscarPais(id)?.toResponse()
            ?: throw RecursoNaoEncontrado("País $id não encontrado")

    suspend fun criarPais(request: PaisRequest): PaisResponse {
        val nome = validarNome(request.nome, "Nome do país")
        val sigla = validarSiglaPais(request.sigla)
        val status = validarStatusVisivel(request.status)
        if (repository.existePaisPorSigla(sigla)) {
            throw invalido("PAIS_SIGLA_DUPLICADA", "Já existe um país com a sigla $sigla", "sigla" to sigla)
        }
        val id = repository.inserirPais(nome, sigla, request.usaSiglaDivisao, status)
        return buscarPais(id)
    }

    suspend fun atualizarPais(id: Long, request: PaisRequest): PaisResponse {
        val nome = validarNome(request.nome, "Nome do país")
        val sigla = validarSiglaPais(request.sigla)
        val status = validarStatusVisivel(request.status)
        repository.buscarPais(id) ?: throw RecursoNaoEncontrado("País $id não encontrado")
        if (repository.existePaisPorSigla(sigla, ignorarId = id)) {
            throw invalido("PAIS_SIGLA_DUPLICADA", "Já existe um país com a sigla $sigla", "sigla" to sigla)
        }
        repository.atualizarPais(id, nome, sigla, request.usaSiglaDivisao, status)
        return buscarPais(id)
    }

    suspend fun excluirPais(id: Long) {
        repository.buscarPais(id) ?: throw RecursoNaoEncontrado("País $id não encontrado")
        if (repository.contarCidadesNaoDeletadasDoPais(id) > 0) {
            throw invalido("PAIS_COM_CIDADES", "Não é possível excluir um país que possui cidades")
        }
        repository.excluirPais(id)
    }

    suspend fun listarDivisoes(idPais: Long?): List<DivisaoResponse> {
        if (idPais != null) {
            repository.buscarPais(idPais)
                ?: throw RecursoNaoEncontrado("País $idPais não encontrado")
        }
        return repository.listarDivisoes(idPais).map { it.toResponse() }
    }

    suspend fun buscarDivisao(id: Long): DivisaoResponse =
        repository.buscarDivisao(id)?.toResponse()
            ?: throw RecursoNaoEncontrado("Divisão $id não encontrada")

    suspend fun criarDivisao(request: DivisaoRequest): DivisaoResponse {
        val nome = validarNome(request.nome, "Nome da divisão")
        val status = validarStatusVisivel(request.status)
        repository.buscarPais(request.idPais)
            ?: throw RecursoNaoEncontrado("País ${request.idPais} não encontrado")
        val sigla = validarSiglaDivisao(request.sigla)
        if (repository.existeDivisao(request.idPais, nome)) {
            throw invalido("DIVISAO_NOME_DUPLICADO", "Já existe uma divisão '$nome' neste país", "nome" to nome)
        }
        val id = repository.inserirDivisao(nome, request.idPais, sigla, status)
        return buscarDivisao(id)
    }

    suspend fun atualizarDivisao(id: Long, request: DivisaoRequest): DivisaoResponse {
        val nome = validarNome(request.nome, "Nome da divisão")
        val status = validarStatusVisivel(request.status)
        repository.buscarDivisao(id) ?: throw RecursoNaoEncontrado("Divisão $id não encontrada")
        repository.buscarPais(request.idPais)
            ?: throw RecursoNaoEncontrado("País ${request.idPais} não encontrado")
        val sigla = validarSiglaDivisao(request.sigla)
        if (repository.existeDivisao(request.idPais, nome, ignorarId = id)) {
            throw invalido("DIVISAO_NOME_DUPLICADO", "Já existe uma divisão '$nome' neste país", "nome" to nome)
        }
        repository.atualizarDivisao(id, nome, request.idPais, sigla, status)
        return buscarDivisao(id)
    }

    suspend fun excluirDivisao(id: Long) {
        repository.buscarDivisao(id) ?: throw RecursoNaoEncontrado("Divisão $id não encontrada")
        if (repository.contarCidadesNaoDeletadasDaDivisao(id) > 0) {
            throw invalido("DIVISAO_COM_CIDADES", "Não é possível excluir uma divisão que possui cidades")
        }
        repository.excluirDivisao(id)
    }

    suspend fun listarCidades(idPais: Long?, idDivisao: Long?): List<CidadeResponse> =
        repository.listarCidades(idPais, idDivisao).map { it.toResponse() }

    suspend fun buscarCidade(id: Long): CidadeResponse =
        repository.buscarCidade(id)?.toResponse()
            ?: throw RecursoNaoEncontrado("Cidade $id não encontrada")

    suspend fun criarCidade(request: CidadeRequest): CidadeResponse {
        val nome = validarNome(request.nome, "Nome da cidade")
        val status = validarStatusVisivel(request.status)
        garantirDivisao(request.idDivisao)
        garantirCidadeUnica(request.idDivisao, nome)
        val id = repository.inserirCidade(nome, request.idDivisao, status)
        return buscarCidade(id)
    }

    suspend fun atualizarCidade(id: Long, request: CidadeRequest): CidadeResponse {
        val nome = validarNome(request.nome, "Nome da cidade")
        val status = validarStatusVisivel(request.status)
        garantirDivisao(request.idDivisao)
        repository.buscarCidade(id)
            ?: throw RecursoNaoEncontrado("Cidade $id não encontrada")
        garantirCidadeUnica(request.idDivisao, nome, ignorarId = id)
        repository.atualizarCidade(id, nome, request.idDivisao, status)
        return buscarCidade(id)
    }

    suspend fun excluirCidade(id: Long) {
        if (!repository.excluirCidade(id)) {
            throw RecursoNaoEncontrado("Cidade $id não encontrada")
        }
    }

    private fun validarNome(nome: String, rotulo: String): String {
        val trimmed = nome.trim()
        if (trimmed.isEmpty()) {
            throw invalido("CAMPO_OBRIGATORIO", "$rotulo é obrigatório")
        }
        return Texto.titleCase(trimmed)
    }

    private fun validarSiglaDivisao(sigla: String?): String? {
        val normalizada = sigla?.trim()?.uppercase()?.takeIf { it.isNotEmpty() } ?: return null
        if (normalizada.length > 10) {
            throw invalido("DIVISAO_SIGLA_TAMANHO", "Sigla da divisão deve ter até 10 caracteres")
        }
        return normalizada
    }

    private fun validarSiglaPais(sigla: String): String {
        val normalizada = sigla.trim().uppercase()
        if (!normalizada.matches(Regex("^[A-Z]{2}$"))) {
            throw invalido("PAIS_SIGLA_ISO", "Sigla do país deve ter 2 letras (ISO)")
        }
        return normalizada
    }

    private fun validarStatusVisivel(status: Status): Status {
        if (status == Status.DELETADO) {
            throw invalido("USE_DELETE", "Use DELETE para marcar como deletado")
        }
        return status
    }

    private suspend fun garantirDivisao(id: Long) {
        repository.buscarDivisao(id)
            ?: throw RecursoNaoEncontrado("Divisão $id não encontrada")
    }

    private suspend fun garantirCidadeUnica(idDivisao: Long, nome: String, ignorarId: Long? = null) {
        if (repository.existeCidade(idDivisao, nome, ignorarId)) {
            throw invalido("CIDADE_NOME_DUPLICADO", "Já existe uma cidade '$nome' nesta divisão", "nome" to nome)
        }
    }

    private fun Pais.toResponse() = PaisResponse(id, nome, sigla, usaSiglaDivisao, status)

    private fun Divisao.toResponse() = DivisaoResponse(id, idPais, nome, sigla, status)

    private fun CidadeDetalhe.toResponse() = CidadeResponse(
        id = cidade.id,
        nome = cidade.nome,
        idDivisao = cidade.idDivisao,
        divisaoNome = divisao.nome,
        divisaoSigla = divisao.sigla,
        idPais = pais.id,
        paisNome = pais.nome,
        paisSigla = pais.sigla,
        status = cidade.status,
    )
}
