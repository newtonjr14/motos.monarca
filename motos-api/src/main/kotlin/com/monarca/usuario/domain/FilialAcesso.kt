package com.monarca.usuario.domain

data class FilialAcesso(
    val id: Long,
    val nome: String,
    val principal: Boolean,
    val moedaOperacao: String = "usd",
)
