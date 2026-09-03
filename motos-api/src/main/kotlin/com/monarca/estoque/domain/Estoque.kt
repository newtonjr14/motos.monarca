package com.monarca.estoque.domain

import com.monarca.common.enums.Status

data class Estoque(
    val id: Long,
    val idFilial: Long,
    val nome: String,
    val status: Status,
)

data class EstoqueDetalhe(
    val estoque: Estoque,
    val filialNome: String,
)
