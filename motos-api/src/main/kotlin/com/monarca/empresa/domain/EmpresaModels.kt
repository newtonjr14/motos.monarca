package com.monarca.empresa.domain

import com.monarca.common.enums.Status

data class Empresa(
    val id: Long,
    val razaoSocial: String,
    val nomeFantasia: String,
    val ruc: String,
    val representanteNome: String?,
    val representanteDocumento: String?,
    val status: Status,
)

data class Filial(
    val id: Long,
    val idEmpresa: Long,
    val nome: String,
    val ddi: String?,
    val telefone: String?,
    val email: String?,
    val tipoLogradouro: String?,
    val logradouro: String?,
    val numero: String?,
    val bairro: String?,
    val cep: String?,
    val complemento: String?,
    val idCidade: Long?,
    val timbrado: String?,
    val timbradoVigenciaInicio: String?,
    val timbradoVigenciaFim: String?,
    val estabelecimentoNumero: String?,
    val pontoExpedicao: String?,
    val principal: Boolean,
    val listarApenasClientesFilial: Boolean,
    val listarApenasFornecedoresFilial: Boolean,
    val status: Status,
)

data class FilialDetalhe(
    val filial: Filial,
    val empresaRazaoSocial: String,
    val empresaNomeFantasia: String,
    val cidadeNome: String?,
    val divisaoNome: String?,
    val divisaoSigla: String?,
    val paisNome: String?,
)
