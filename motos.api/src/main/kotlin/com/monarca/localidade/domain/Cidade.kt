package com.monarca.localidade.domain

data class Cidade(
    val id: Long,
    val idDivisao: Long,
    val nome: String,
    val status: Status,
)
