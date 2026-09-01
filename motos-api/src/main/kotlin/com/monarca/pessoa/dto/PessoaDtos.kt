package com.monarca.pessoa.dto

import com.monarca.common.enums.Status
import com.monarca.pessoa.domain.TipoPessoa
import kotlinx.serialization.Serializable

@Serializable
data class DocumentoTipoRequest(
    val idPais: Long,
    val tipoPessoa: TipoPessoa,
    val codigo: String,
    val nome: String,
    val unico: Boolean = true,
)

@Serializable
data class DocumentoTipoResponse(
    val id: Long,
    val idPais: Long,
    val tipoPessoa: TipoPessoa,
    val codigo: String,
    val nome: String,
    val unico: Boolean,
)

@Serializable
data class DocumentoRequest(
    val idPais: Long,
    val idTipoDocumento: Long? = null,
    val tipoLivre: String? = null,
    val numero: String,
)

@Serializable
data class DocumentoResponse(
    val id: Long,
    val idPais: Long,
    val paisNome: String,
    val paisSigla: String,
    val idTipoDocumento: Long? = null,
    val tipoCodigo: String? = null,
    val tipoNome: String,
    val numero: String,
    val unico: Boolean,
)

@Serializable
data class PessoaRequest(
    val nomeRazaoSocial: String,
    val tipoPessoa: TipoPessoa,
    val ddi: String? = null,
    val telefone: String? = null,
    val email: String? = null,
    val tipoLogradouro: String? = null,
    val logradouro: String? = null,
    val numero: String? = null,
    val bairro: String? = null,
    val cep: String? = null,
    val complemento: String? = null,
    val idCidade: Long? = null,
    val status: Status = Status.ATIVO,
    val documentos: List<DocumentoRequest>,
    val confirmarNovaPessoa: Boolean = false,
)

@Serializable
data class PessoaResponse(
    val id: Long,
    val nomeRazaoSocial: String,
    val tipoPessoa: TipoPessoa,
    val ddi: String? = null,
    val telefone: String? = null,
    val email: String? = null,
    val tipoLogradouro: String? = null,
    val logradouro: String? = null,
    val numero: String? = null,
    val bairro: String? = null,
    val cep: String? = null,
    val complemento: String? = null,
    val idCidade: Long? = null,
    val status: Status,
    val documentos: List<DocumentoResponse>,
)

@Serializable
data class PessoaResumoResponse(
    val id: Long,
    val nomeRazaoSocial: String,
    val tipoPessoa: TipoPessoa,
)

@Serializable
data class FilialVinculoResponse(
    val id: Long,
    val nome: String,
)

@Serializable
data class DocumentoConflitoResponse(
    val codigo: String,
    val message: String,
    val pessoa: PessoaResumoResponse,
    val idPapel: Long? = null,
    val filiaisVinculadas: List<FilialVinculoResponse> = emptyList(),
)

@Serializable
data class VinculoFilialConflitoResponse(
    val codigo: String,
    val message: String,
    val idPapel: Long,
    val pessoa: PessoaResumoResponse,
    val filiaisVinculadas: List<FilialVinculoResponse>,
    val idFilialAlvo: Long,
    val filialAlvoNome: String,
)

@Serializable
data class PapelRequest(
    val idPessoa: Long? = null,
    val idFilialCadastro: Long? = null,
    val confirmarVinculoFilial: Boolean = false,
    val status: Status = Status.ATIVO,
    val pessoa: PessoaRequest? = null,
)

@Serializable
data class PapelResponse(
    val id: Long,
    val idPessoa: Long,
    val idFilialCadastro: Long?,
    val filialNome: String? = null,
    val filiaisVinculadas: List<FilialVinculoResponse> = emptyList(),
    val status: Status,
    val pessoa: PessoaResponse,
)

@Serializable
data class MensagemErro(
    val message: String,
)
