package com.monarca.pessoa.domain

import com.monarca.common.enums.Status

data class Pessoa(
    val id: Long,
    val nomeRazaoSocial: String,
    val tipoPessoa: TipoPessoa,
    val ddi: String? = null,
    val telefone: String? = null,
    val email: String? = null,
    val status: Status,
)
