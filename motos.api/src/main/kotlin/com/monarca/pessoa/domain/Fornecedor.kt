package com.monarca.pessoa.domain

data class Fornecedor(
    val id: Long,
    val idPessoa: Long,
    val status: StatusClienteFornecedor,
)