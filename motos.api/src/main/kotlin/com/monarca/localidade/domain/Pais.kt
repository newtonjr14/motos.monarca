package com.monarca.localidade.domain

data class Pais(
    val id: Long,
    val nome: String,
    val sigla: String,
    val usaSiglaDivisao: Boolean,
    val status: Status,
)
