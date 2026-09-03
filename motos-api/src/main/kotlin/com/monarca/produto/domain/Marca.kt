package com.monarca.produto.domain

import com.monarca.common.enums.Status

data class Marca(
    val id: Long,
    val nome: String,
    val status: Status,
)

data class Modelo(
    val id: Long,
    val idMarca: Long,
    val nome: String,
    val tipo: TipoProduto,
    val status: Status,
)

data class ModeloDetalhe(
    val modelo: Modelo,
    val marcaNome: String,
)
