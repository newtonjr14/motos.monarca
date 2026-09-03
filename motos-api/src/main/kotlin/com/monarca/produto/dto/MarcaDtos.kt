package com.monarca.produto.dto

import com.monarca.common.enums.Status
import com.monarca.produto.domain.TipoProduto
import kotlinx.serialization.Serializable

@Serializable
data class MarcaRequest(
    val nome: String,
    val status: Status = Status.ATIVO,
)

@Serializable
data class MarcaResponse(
    val id: Long,
    val nome: String,
    val status: Status,
)

@Serializable
data class ModeloRequest(
    val idMarca: Long,
    val nome: String,
    val tipo: TipoProduto,
    val status: Status = Status.ATIVO,
)

@Serializable
data class ModeloResponse(
    val id: Long,
    val idMarca: Long,
    val marcaNome: String,
    val nome: String,
    val tipo: TipoProduto,
    val status: Status,
)
