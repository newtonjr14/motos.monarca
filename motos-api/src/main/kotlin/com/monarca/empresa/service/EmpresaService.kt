package com.monarca.empresa.service

import com.monarca.Texto
import com.monarca.common.enums.Status
import com.monarca.empresa.domain.Empresa
import com.monarca.empresa.domain.Filial
import com.monarca.empresa.domain.FilialDetalhe
import com.monarca.empresa.dto.EmpresaRequest
import com.monarca.empresa.dto.EmpresaResponse
import com.monarca.empresa.dto.FilialRequest
import com.monarca.empresa.dto.FilialResponse
import com.monarca.empresa.repository.EmpresaRepository
import com.monarca.localidade.repository.LocalidadeRepository
import com.monarca.localidade.service.RecursoNaoEncontrado
import com.monarca.localidade.service.RequisicaoInvalida
import com.monarca.pessoa.domain.DocumentoValidador

class EmpresaService(
    private val repository: EmpresaRepository,
    private val localidadeRepository: LocalidadeRepository,
) {

    suspend fun listarEmpresas(): List<EmpresaResponse> =
        repository.listarEmpresas().map { it.toResponse() }

    suspend fun buscarEmpresa(id: Long): EmpresaResponse =
        repository.buscarEmpresa(id)?.toResponse()
            ?: throw RecursoNaoEncontrado("Empresa $id não encontrada")

    suspend fun criarEmpresa(request: EmpresaRequest): EmpresaResponse {
        val empresa = validarEmpresa(request, id = 0)
        if (repository.existeEmpresaPorRuc(empresa.ruc)) {
            throw RequisicaoInvalida("Já existe uma empresa com o RUC ${empresa.ruc}")
        }
        val id = repository.inserirEmpresa(empresa.copy(id = 0))
        return buscarEmpresa(id)
    }

    suspend fun atualizarEmpresa(id: Long, request: EmpresaRequest): EmpresaResponse {
        repository.buscarEmpresa(id) ?: throw RecursoNaoEncontrado("Empresa $id não encontrada")
        val empresa = validarEmpresa(request, id)
        if (repository.existeEmpresaPorRuc(empresa.ruc, ignorarId = id)) {
            throw RequisicaoInvalida("Já existe uma empresa com o RUC ${empresa.ruc}")
        }
        repository.atualizarEmpresa(id, empresa)
        return buscarEmpresa(id)
    }

    suspend fun excluirEmpresa(id: Long) {
        repository.buscarEmpresa(id) ?: throw RecursoNaoEncontrado("Empresa $id não encontrada")
        if (repository.listarFiliais(id).isNotEmpty()) {
            throw RequisicaoInvalida("Não é possível excluir uma empresa que possui filiais")
        }
        if (!repository.excluirEmpresa(id)) {
            throw RecursoNaoEncontrado("Empresa $id não encontrada")
        }
    }

    suspend fun listarFiliais(idEmpresa: Long?): List<FilialResponse> {
        if (idEmpresa != null) {
            repository.buscarEmpresa(idEmpresa)
                ?: throw RecursoNaoEncontrado("Empresa $idEmpresa não encontrada")
        }
        return repository.listarFiliais(idEmpresa).map { it.toResponse() }
    }

    suspend fun buscarFilial(id: Long): FilialResponse =
        repository.buscarFilial(id)?.toResponse()
            ?: throw RecursoNaoEncontrado("Filial $id não encontrada")

    suspend fun buscarFilialPrincipal(): FilialResponse =
        repository.buscarFilialPrincipal()?.toResponse()
            ?: throw RecursoNaoEncontrado("Filial principal não configurada")

    suspend fun criarFilial(request: FilialRequest): FilialResponse {
        val filial = validarFilial(request, id = 0)
        repository.buscarEmpresa(filial.idEmpresa)
            ?: throw RecursoNaoEncontrado("Empresa ${filial.idEmpresa} não encontrada")
        if (filial.principal) {
            repository.limparPrincipal(filial.idEmpresa)
        }
        val id = repository.inserirFilial(filial.copy(id = 0))
        return buscarFilial(id)
    }

    suspend fun atualizarFilial(id: Long, request: FilialRequest): FilialResponse {
        repository.buscarFilial(id) ?: throw RecursoNaoEncontrado("Filial $id não encontrada")
        val filial = validarFilial(request, id)
        repository.buscarEmpresa(filial.idEmpresa)
            ?: throw RecursoNaoEncontrado("Empresa ${filial.idEmpresa} não encontrada")
        if (filial.principal) {
            repository.limparPrincipal(filial.idEmpresa, excetoId = id)
        }
        repository.atualizarFilial(id, filial)
        return buscarFilial(id)
    }

    suspend fun excluirFilial(id: Long) {
        val atual = repository.buscarFilial(id) ?: throw RecursoNaoEncontrado("Filial $id não encontrada")
        if (atual.filial.principal) {
            throw RequisicaoInvalida("Não é possível excluir a filial principal")
        }
        if (repository.filialEmUso(id)) {
            throw RequisicaoInvalida("Não é possível excluir uma filial vinculada a cadastros")
        }
        if (!repository.excluirFilial(id)) {
            throw RecursoNaoEncontrado("Filial $id não encontrada")
        }
    }

    suspend fun resolverFilialCadastro(idFilialCadastro: Long?): Long {
        if (idFilialCadastro != null) {
            repository.buscarFilial(idFilialCadastro)
                ?: throw RequisicaoInvalida("Filial $idFilialCadastro não encontrada")
            return idFilialCadastro
        }
        return buscarFilialPrincipal().id
    }

    private fun validarEmpresa(request: EmpresaRequest, id: Long): Empresa {
        val razaoSocial = validarTexto(request.razaoSocial, "Razão social")
        val nomeFantasia = validarTexto(request.nomeFantasia, "Nome fantasia")
        val ruc = DocumentoValidador.normalizarRuc(request.ruc)
        val status = validarStatusVisivel(request.status)
        return Empresa(
            id = id,
            razaoSocial = razaoSocial,
            nomeFantasia = nomeFantasia,
            ruc = ruc,
            representanteNome = request.representanteNome?.trim()?.takeIf { it.isNotEmpty() }?.let(Texto::titleCase),
            representanteDocumento = request.representanteDocumento?.trim()?.takeIf { it.isNotEmpty() },
            status = status,
        )
    }

    private suspend fun validarFilial(request: FilialRequest, id: Long): Filial {
        val nome = validarTexto(request.nome, "Nome da filial")
        val status = validarStatusVisivel(request.status)
        request.idCidade?.let { idCidade ->
            localidadeRepository.buscarCidade(idCidade)
                ?: throw RecursoNaoEncontrado("Cidade $idCidade não encontrada")
        }
        return Filial(
            id = id,
            idEmpresa = request.idEmpresa,
            nome = nome,
            ddi = request.ddi?.trim()?.takeIf { it.isNotEmpty() },
            telefone = request.telefone?.trim()?.takeIf { it.isNotEmpty() },
            email = request.email?.trim()?.takeIf { it.isNotEmpty() },
            tipoLogradouro = request.tipoLogradouro?.trim()?.takeIf { it.isNotEmpty() },
            logradouro = request.logradouro?.trim()?.takeIf { it.isNotEmpty() },
            numero = request.numero?.trim()?.takeIf { it.isNotEmpty() },
            bairro = request.bairro?.trim()?.takeIf { it.isNotEmpty() },
            cep = request.cep?.trim()?.takeIf { it.isNotEmpty() },
            complemento = request.complemento?.trim()?.takeIf { it.isNotEmpty() },
            idCidade = request.idCidade,
            timbrado = request.timbrado?.trim()?.takeIf { it.isNotEmpty() },
            timbradoVigenciaInicio = request.timbradoVigenciaInicio?.trim()?.takeIf { it.isNotEmpty() },
            timbradoVigenciaFim = request.timbradoVigenciaFim?.trim()?.takeIf { it.isNotEmpty() },
            estabelecimentoNumero = request.estabelecimentoNumero?.trim()?.takeIf { it.isNotEmpty() },
            pontoExpedicao = request.pontoExpedicao?.trim()?.takeIf { it.isNotEmpty() },
            principal = request.principal,
            listarApenasClientesFilial = request.listarApenasClientesFilial,
            listarApenasFornecedoresFilial = request.listarApenasFornecedoresFilial,
            status = status,
        )
    }

    private fun validarTexto(valor: String, rotulo: String): String {
        val trimmed = valor.trim()
        if (trimmed.isEmpty()) {
            throw RequisicaoInvalida("$rotulo é obrigatório")
        }
        return Texto.titleCase(trimmed)
    }

    private fun validarStatusVisivel(status: Status): Status {
        if (status == Status.DELETADO) {
            throw RequisicaoInvalida("Use DELETE para marcar como deletado")
        }
        return status
    }

    private fun Empresa.toResponse() = EmpresaResponse(
        id = id,
        razaoSocial = razaoSocial,
        nomeFantasia = nomeFantasia,
        ruc = ruc,
        representanteNome = representanteNome,
        representanteDocumento = representanteDocumento,
        status = status,
    )

    private fun FilialDetalhe.toResponse() = FilialResponse(
        id = filial.id,
        idEmpresa = filial.idEmpresa,
        empresaRazaoSocial = empresaRazaoSocial,
        empresaNomeFantasia = empresaNomeFantasia,
        nome = filial.nome,
        ddi = filial.ddi,
        telefone = filial.telefone,
        email = filial.email,
        tipoLogradouro = filial.tipoLogradouro,
        logradouro = filial.logradouro,
        numero = filial.numero,
        bairro = filial.bairro,
        cep = filial.cep,
        complemento = filial.complemento,
        idCidade = filial.idCidade,
        cidadeNome = cidadeNome,
        divisaoSigla = divisaoSigla,
        paisNome = paisNome,
        timbrado = filial.timbrado,
        timbradoVigenciaInicio = filial.timbradoVigenciaInicio,
        timbradoVigenciaFim = filial.timbradoVigenciaFim,
        estabelecimentoNumero = filial.estabelecimentoNumero,
        pontoExpedicao = filial.pontoExpedicao,
        principal = filial.principal,
        listarApenasClientesFilial = filial.listarApenasClientesFilial,
        listarApenasFornecedoresFilial = filial.listarApenasFornecedoresFilial,
        status = filial.status,
    )
}
