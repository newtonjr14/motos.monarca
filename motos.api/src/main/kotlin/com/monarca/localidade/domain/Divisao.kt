package com.monarca.localidade.domain

data class Divisao(
    val id: Long,
    val idPais: Long,
    val nome: String,
    val sigla: String?,
    val status: Status,
)
