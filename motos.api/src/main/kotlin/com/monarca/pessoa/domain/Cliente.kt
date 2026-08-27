package com.monarca.pessoa.domain

data class Cliente(
    val id: Long,
    val idPessoa: Long,
    val status: StatusClienteFornecedor,
)