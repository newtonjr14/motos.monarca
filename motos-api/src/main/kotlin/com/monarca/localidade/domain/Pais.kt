package com.monarca.localidade.domain

import com.monarca.common.enums.Status

data class Pais(
    val id: Long,
    val nome: String,
    val sigla: String,
    val usaSiglaDivisao: Boolean,
    val status: Status,
)
