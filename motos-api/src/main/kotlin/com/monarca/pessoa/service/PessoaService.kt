package com.monarca.pessoa.service

import com.monarca.Texto
import com.monarca.common.enums.Status
import com.monarca.localidade.repository.LocalidadeRepository
import com.monarca.localidade.service.RecursoNaoEncontrado
import com.monarca.localidade.service.invalido
import com.monarca.pessoa.domain.DocumentoTipo
import com.monarca.pessoa.domain.DocumentoValidador
import com.monarca.pessoa.domain.Pessoa
import com.monarca.pessoa.domain.PessoaCompleta
import com.monarca.pessoa.domain.PessoaDocumentoDetalhe
import com.monarca.pessoa.domain.PessoaEndereco
import com.monarca.pessoa.domain.TipoPessoa
import com.monarca.pessoa.dto.DocumentoConflitoResponse
import com.monarca.pessoa.dto.DocumentoRequest
import com.monarca.pessoa.dto.DocumentoResponse
import com.monarca.pessoa.dto.DocumentoTipoRequest
import com.monarca.pessoa.dto.DocumentoTipoResponse
import com.monarca.pessoa.dto.EnderecoRequest
import com.monarca.pessoa.dto.EnderecoResponse
import com.monarca.pessoa.dto.PessoaRequest
import com.monarca.pessoa.dto.PessoaResponse
import com.monarca.pessoa.dto.PessoaResumoResponse
import com.monarca.pessoa.repository.DocumentoNovo
import com.monarca.pessoa.repository.EnderecoNovo
import com.monarca.pessoa.repository.PessoaRepository

class DocumentoConflito(
    val codigo: String,
    val pessoa: Pessoa,
    message: String,
    val params: Map<String, String> = emptyMap(),
) : RuntimeException(message)

class PessoaService(
    private val repository: PessoaRepository,
    private val localidadeRepository: LocalidadeRepository,
) {

    suspend fun init() = repository.inicializar()

    suspend fun listarTipos(idPais: Long?, tipoPessoa: TipoPessoa?): List<DocumentoTipoResponse> =
        repository.listarTipos(idPais, tipoPessoa).map { it.toResponse() }

    suspend fun buscarTipo(id: Long): DocumentoTipoResponse =
        repository.buscarTipo(id)?.toResponse()
            ?: throw RecursoNaoEncontrado("Tipo de documento $id não encontrado")

    suspend fun criarTipo(request: DocumentoTipoRequest): DocumentoTipoResponse {
        val normalizado = normalizarTipo(request)
        localidadeRepository.buscarPais(normalizado.idPais)
            ?: throw RecursoNaoEncontrado("País ${normalizado.idPais} não encontrado")
        val duplicado = repository.listarTipos(normalizado.idPais, null)
            .any { it.codigo.equals(normalizado.codigo, ignoreCase = true) }
        if (duplicado) {
            throw invalido("DOCUMENTO_TIPO_CODIGO_DUPLICADO", "Já existe um tipo com o código ${normalizado.codigo} neste país", "codigo" to normalizado.codigo)
        }
        val id = repository.inserirTipo(normalizado)
        return buscarTipo(id)
    }

    suspend fun atualizarTipo(id: Long, request: DocumentoTipoRequest): DocumentoTipoResponse {
        repository.buscarTipo(id) ?: throw RecursoNaoEncontrado("Tipo de documento $id não encontrado")
        val normalizado = normalizarTipo(request)
        localidadeRepository.buscarPais(normalizado.idPais)
            ?: throw RecursoNaoEncontrado("País ${normalizado.idPais} não encontrado")
        val duplicado = repository.listarTipos(normalizado.idPais, null)
            .any { it.id != id && it.codigo.equals(normalizado.codigo, ignoreCase = true) }
        if (duplicado) {
            throw invalido("DOCUMENTO_TIPO_CODIGO_DUPLICADO", "Já existe um tipo com o código ${normalizado.codigo} neste país", "codigo" to normalizado.codigo)
        }
        if (!repository.atualizarTipo(id, normalizado.copy(id = id))) {
            throw RecursoNaoEncontrado("Tipo de documento $id não encontrado")
        }
        return buscarTipo(id)
    }

    suspend fun excluirTipo(id: Long) {
        repository.buscarTipo(id) ?: throw RecursoNaoEncontrado("Tipo de documento $id não encontrado")
        if (repository.tipoEmUso(id)) {
            throw invalido("DOCUMENTO_TIPO_EM_USO", "Tipo em uso por pessoas cadastradas e não pode ser excluído")
        }
        if (!repository.excluirTipo(id)) {
            throw RecursoNaoEncontrado("Tipo de documento $id não encontrado")
        }
    }

    suspend fun listar(): List<PessoaResponse> = repository.listarPessoas().map { it.toResponse() }

    suspend fun buscar(id: Long): PessoaResponse =
        repository.buscarPessoa(id)?.toResponse()
            ?: throw RecursoNaoEncontrado("Pessoa $id não encontrada")

    suspend fun criar(request: PessoaRequest): PessoaResponse {
        val normalizada = normalizar(request)
        verificarConflitos(normalizada.documentos, ignorarPessoaId = null, request.confirmarNovaPessoa)
        val id = repository.inserirPessoa(normalizada.pessoa, normalizada.documentos, normalizada.enderecos)
        return buscar(id)
    }

    suspend fun atualizar(id: Long, request: PessoaRequest): PessoaResponse {
        repository.buscarPessoa(id) ?: throw RecursoNaoEncontrado("Pessoa $id não encontrada")
        val normalizada = normalizar(request, id)
        verificarConflitos(normalizada.documentos, ignorarPessoaId = id, request.confirmarNovaPessoa)
        if (!repository.atualizarPessoa(id, normalizada.pessoa, normalizada.documentos, normalizada.enderecos)) {
            throw RecursoNaoEncontrado("Pessoa $id não encontrada")
        }
        return buscar(id)
    }

    suspend fun excluir(id: Long) {
        if (!repository.excluirPessoa(id)) {
            throw RecursoNaoEncontrado("Pessoa $id não encontrada")
        }
    }

    fun toConflitoResponse(e: DocumentoConflito) = DocumentoConflitoResponse(
        codigo = e.codigo,
        message = e.message ?: "Documento em conflito",
        params = e.params,
        pessoa = PessoaResumoResponse(
            id = e.pessoa.id,
            nomeRazaoSocial = e.pessoa.nomeRazaoSocial,
            tipoPessoa = e.pessoa.tipoPessoa,
        ),
    )

    private suspend fun normalizar(request: PessoaRequest, id: Long = 0): PessoaNormalizada {
        val nome = Texto.titleCase(validarObrigatorio(request.nomeRazaoSocial, "Nome / razão social"))
        val status = validarStatusVisivel(request.status)
        if (request.documentos.isEmpty()) {
            throw invalido("DOCUMENTO_OBRIGATORIO", "Informe pelo menos um documento")
        }

        val ddi = soDigitos(request.ddi)
        val telefone = soDigitos(request.telefone)
        if ((ddi == null) != (telefone == null)) {
            throw invalido("TELEFONE_PAR", "Informe DDI e telefone juntos, ou deixe ambos vazios")
        }

        val documentos = request.documentos.map { normalizarDocumento(it, request.tipoPessoa) }
        garantirDocumentosDistintos(documentos)
        val enderecos = normalizarEnderecos(request.enderecos)

        return PessoaNormalizada(
            pessoa = Pessoa(
                id = id,
                nomeRazaoSocial = nome,
                tipoPessoa = request.tipoPessoa,
                ddi = ddi,
                telefone = telefone,
                email = Texto.email(request.email),
                status = status,
            ),
            documentos = documentos,
            enderecos = enderecos,
        )
    }

    private suspend fun normalizarEnderecos(requests: List<EnderecoRequest>): List<EnderecoNovo> {
        val preenchidos = requests.filterNot { enderecoVazio(it) }
        if (preenchidos.isEmpty()) return emptyList()

        val comPrincipal = when {
            preenchidos.size == 1 -> listOf(preenchidos.first().copy(principal = true))
            preenchidos.count { it.principal } > 1 ->
                throw invalido("ENDERECO_PRINCIPAL_UNICO", "Só pode existir um endereço principal ativo por pessoa")
            preenchidos.none { it.principal } ->
                throw invalido("ENDERECO_PRINCIPAL_OBRIGATORIO", "Informe um endereço principal")
            else -> preenchidos
        }

        return comPrincipal.map { request ->
            request.idCidade?.let { idCidade ->
                localidadeRepository.buscarCidade(idCidade)
                    ?: throw RecursoNaoEncontrado("Cidade $idCidade não encontrada")
            }
            EnderecoNovo(
                tipo = request.tipo,
                principal = request.principal,
                tipoLogradouro = opcional(request.tipoLogradouro)?.let(Texto::titleCase),
                logradouro = opcional(request.logradouro)?.let(Texto::titleCase),
                numero = opcional(request.numero),
                bairro = opcional(request.bairro)?.let(Texto::titleCase),
                cep = soDigitos(request.cep),
                complemento = opcional(request.complemento)?.let(Texto::titleCase),
                idCidade = request.idCidade,
            )
        }
    }

    private fun enderecoVazio(request: EnderecoRequest): Boolean =
        opcional(request.tipoLogradouro) == null &&
            opcional(request.logradouro) == null &&
            opcional(request.numero) == null &&
            opcional(request.bairro) == null &&
            opcional(request.cep) == null &&
            opcional(request.complemento) == null &&
            request.idCidade == null

    private suspend fun normalizarDocumento(
        request: DocumentoRequest,
        tipoPessoa: TipoPessoa,
    ): DocumentoNovo {
        localidadeRepository.buscarPais(request.idPais)
            ?: throw RecursoNaoEncontrado("País ${request.idPais} não encontrado")

        val idTipo = request.idTipoDocumento
        val tipoLivreInformado = request.tipoLivre?.trim()?.takeIf { it.isNotEmpty() }
        if (idTipo != null && tipoLivreInformado != null) {
            throw invalido("DOCUMENTO_TIPO_XOR", "Informe o tipo de catálogo ou o tipo livre, não os dois")
        }
        if (idTipo == null && tipoLivreInformado == null) {
            throw invalido("DOCUMENTO_TIPO_OBRIGATORIO", "Informe o tipo de documento")
        }

        if (idTipo != null) {
            val tipo = repository.buscarTipo(idTipo)
                ?: throw RecursoNaoEncontrado("Tipo de documento $idTipo não encontrado")
            if (tipo.idPais != request.idPais) {
                throw invalido("DOCUMENTO_TIPO_PAIS", "Tipo ${tipo.codigo} não pertence a este país", "codigo" to tipo.codigo)
            }
            if (tipo.tipoPessoa != tipoPessoa) {
                throw invalido("DOCUMENTO_TIPO_PESSOA", "${tipo.nome} é documento de pessoa ${tipo.tipoPessoa.name.lowercase()}", "nome" to tipo.nome)
            }
            val numero = when {
                DocumentoValidador.temValidacao(tipo.codigo) ->
                    DocumentoValidador.normalizarPorCodigo(tipo.codigo, request.numero)
                tipo.unico -> normalizarNumeroCatalogoGenerico(request.numero)
                else -> normalizarNumeroLivre(request.numero)
            }
            return DocumentoNovo(request.idPais, idTipo, tipoLivre = null, numero)
        }

        return DocumentoNovo(
            idPais = request.idPais,
            idTipoDocumento = null,
            tipoLivre = tipoLivreInformado!!.uppercase(),
            numero = normalizarNumeroLivre(request.numero),
        )
    }

    private fun normalizarNumeroCatalogoGenerico(numero: String): String {
        val normalizado = numero.filter { it.isLetterOrDigit() }.uppercase()
        if (normalizado.isEmpty()) {
            throw invalido("DOCUMENTO_NUMERO_OBRIGATORIO", "Número do documento é obrigatório")
        }
        return normalizado
    }

    private fun normalizarNumeroLivre(numero: String): String {
        val normalizado = numero.filter { it.isLetterOrDigit() }.uppercase()
        if (normalizado.isEmpty()) {
            throw invalido("DOCUMENTO_NUMERO_OBRIGATORIO", "Número do documento é obrigatório")
        }
        return normalizado
    }

    private fun garantirDocumentosDistintos(documentos: List<DocumentoNovo>) {
        val vistos = mutableSetOf<Triple<Long, Long?, String>>()
        for (doc in documentos) {
            val chave = if (doc.idTipoDocumento != null) {
                Triple(doc.idPais, doc.idTipoDocumento, doc.numero)
            } else {
                Triple(doc.idPais, null, "${doc.tipoLivre}:${doc.numero}")
            }
            if (!vistos.add(chave)) {
                throw invalido("DOCUMENTOS_REPETIDOS", "Há documentos repetidos na requisição")
            }
        }
    }

    private suspend fun verificarConflitos(
        documentos: List<DocumentoNovo>,
        ignorarPessoaId: Long?,
        confirmarNovaPessoa: Boolean,
    ) {
        for (doc in documentos) {
            if (doc.idTipoDocumento != null) {
                val tipo = repository.buscarTipo(doc.idTipoDocumento) ?: continue
                if (!tipo.unico) continue
                val existente = repository.buscarPessoaPorTipoUnico(doc.idTipoDocumento, doc.numero, ignorarPessoaId)
                    ?: continue
                throw DocumentoConflito(
                    codigo = "DOCUMENTO_UNICO",
                    pessoa = existente,
                    message = "Já existe uma pessoa cadastrada com ${tipo.nome} ${doc.numero}",
                    params = mapOf("tipo" to tipo.nome, "numero" to doc.numero),
                )
            }

            val existente = repository.buscarPessoaPorDocumentoLivre(
                doc.idPais,
                doc.tipoLivre!!,
                doc.numero,
                ignorarPessoaId,
            ) ?: continue
            if (!confirmarNovaPessoa) {
                throw DocumentoConflito(
                    codigo = "DOCUMENTO_POSSIVEL_DUPLICADO",
                    pessoa = existente,
                    message = "Já existe uma pessoa com o mesmo documento. Confirme se deseja cadastrar outra pessoa.",
                )
            }
        }
    }

    private fun validarObrigatorio(valor: String, rotulo: String): String {
        val trimmed = valor.trim()
        if (trimmed.isEmpty()) {
            throw invalido("CAMPO_OBRIGATORIO", "$rotulo é obrigatório")
        }
        return trimmed
    }

    private fun opcional(valor: String?): String? = valor?.trim()?.takeIf { it.isNotEmpty() }

    private fun soDigitos(valor: String?): String? =
        valor?.filter { it.isDigit() }?.takeIf { it.isNotEmpty() }

    private fun validarStatusVisivel(status: Status): Status {
        if (status == Status.DELETADO) {
            throw invalido("USE_DELETE", "Use DELETE para marcar como deletado")
        }
        return status
    }

    private fun normalizarTipo(request: DocumentoTipoRequest, id: Long = 0) = DocumentoTipo(
        id = id,
        idPais = request.idPais,
        tipoPessoa = request.tipoPessoa,
        codigo = validarObrigatorio(request.codigo, "Código").uppercase(),
        nome = Texto.titleCase(validarObrigatorio(request.nome, "Nome")),
        unico = request.unico,
    )

    fun asResponse(completa: PessoaCompleta) = completa.toResponse()

    private fun DocumentoTipo.toResponse() = DocumentoTipoResponse(
        id = id,
        idPais = idPais,
        tipoPessoa = tipoPessoa,
        codigo = codigo,
        nome = nome,
        unico = unico,
    )

    internal fun PessoaCompleta.toResponse() = PessoaResponse(
        id = pessoa.id,
        nomeRazaoSocial = pessoa.nomeRazaoSocial,
        tipoPessoa = pessoa.tipoPessoa,
        ddi = pessoa.ddi,
        telefone = pessoa.telefone,
        email = pessoa.email,
        enderecos = enderecos.map { it.toResponse() },
        status = pessoa.status,
        documentos = documentos.map { it.toResponse() },
    )

    private fun PessoaEndereco.toResponse() = EnderecoResponse(
        id = id,
        tipo = tipo,
        principal = principal,
        tipoLogradouro = tipoLogradouro,
        logradouro = logradouro,
        numero = numero,
        bairro = bairro,
        cep = cep,
        complemento = complemento,
        idCidade = idCidade,
        status = status,
    )

    internal fun PessoaDocumentoDetalhe.toResponse() = DocumentoResponse(
        id = documento.id,
        idPais = documento.idPais,
        paisNome = paisNome,
        paisSigla = paisSigla,
        idTipoDocumento = documento.idTipoDocumento,
        tipoCodigo = tipo?.codigo,
        tipoNome = tipo?.nome ?: documento.tipoLivre.orEmpty(),
        numero = documento.numero,
        unico = tipo?.unico ?: false,
    )

    private data class PessoaNormalizada(
        val pessoa: Pessoa,
        val documentos: List<DocumentoNovo>,
        val enderecos: List<EnderecoNovo>,
    )
}
