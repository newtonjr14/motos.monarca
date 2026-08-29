package com.monarca.pessoa.domain

import com.monarca.common.enums.Status

data class PapelCompleto(
    val id: Long,
    val idPessoa: Long,
    val status: Status,
    val pessoa: PessoaCompleta,
)
