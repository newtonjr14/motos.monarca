package com.monarca.cotacao.domain

import com.monarca.common.enums.Status

data class Cotacao(
    val id: Long,
    val data: String,
    val usdPyg: Double,
    val brlPyg: Double,
    val status: Status,
)
