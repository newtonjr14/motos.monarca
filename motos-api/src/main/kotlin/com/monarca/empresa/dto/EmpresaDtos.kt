package com.monarca.empresa.dto

import com.monarca.common.enums.Status
import kotlinx.serialization.Serializable

@Serializable
data class EmpresaRequest(
    val razaoSocial: String,
    val nomeFantasia: String,
    val ruc: String,
    val representanteNome: String? = null,
    val representanteDocumento: String? = null,
    val status: Status = Status.ATIVO,
)

@Serializable
data class EmpresaResponse(
    val id: Long,
    val razaoSocial: String,
    val nomeFantasia: String,
    val ruc: String,
    val representanteNome: String? = null,
    val representanteDocumento: String? = null,
    val status: Status,
)

@Serializable
data class FilialRequest(
    val idEmpresa: Long,
    val nome: String,
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
    val timbrado: String? = null,
    val timbradoVigenciaInicio: String? = null,
    val timbradoVigenciaFim: String? = null,
    val estabelecimentoNumero: String? = null,
    val pontoExpedicao: String? = null,
    val principal: Boolean = false,
    val listarApenasClientesFilial: Boolean = true,
    val listarApenasFornecedoresFilial: Boolean = true,
    val listarApenasProdutosFilial: Boolean = true,
    val status: Status = Status.ATIVO,
)

@Serializable
data class FilialResponse(
    val id: Long,
    val idEmpresa: Long,
    val empresaRazaoSocial: String,
    val empresaNomeFantasia: String,
    val nome: String,
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
    val cidadeNome: String? = null,
    val divisaoSigla: String? = null,
    val paisNome: String? = null,
    val timbrado: String? = null,
    val timbradoVigenciaInicio: String? = null,
    val timbradoVigenciaFim: String? = null,
    val estabelecimentoNumero: String? = null,
    val pontoExpedicao: String? = null,
    val principal: Boolean,
    val listarApenasClientesFilial: Boolean,
    val listarApenasFornecedoresFilial: Boolean,
    val listarApenasProdutosFilial: Boolean,
    val status: Status,
)
