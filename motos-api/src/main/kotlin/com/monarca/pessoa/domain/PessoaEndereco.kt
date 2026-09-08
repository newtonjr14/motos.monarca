package com.monarca.pessoa.domain

import com.monarca.common.enums.Status

data class PessoaEndereco(
    val id: Long,
    val idPessoa: Long,
    val tipo: TipoEndereco,
    val principal: Boolean,
    val tipoLogradouro: String?,
    val logradouro: String?,
    val numero: String?,
    val bairro: String?,
    val cep: String?,
    val complemento: String?,
    val idCidade: Long?,
    val status: Status,
)
