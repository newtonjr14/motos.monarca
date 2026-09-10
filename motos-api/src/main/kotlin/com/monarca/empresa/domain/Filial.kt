package com.monarca.empresa.domain

import com.monarca.common.enums.Status
import com.monarca.produto.domain.Moeda

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
    val perfilFiscal: PerfilFiscal,
    val moedaOperacao: Moeda,
    val idEstoquePadrao: Long? = null,
    val principal: Boolean,
    val listarApenasClientesFilial: Boolean,
    val listarApenasFornecedoresFilial: Boolean,
    val listarApenasProdutosFilial: Boolean,
    val status: Status,
)
