package com.monarca.cotacao.dto

import com.monarca.common.enums.Status
import kotlinx.serialization.Serializable

@Serializable
data class CotacaoRequest(
    val data: String,
    val usdPyg: Double,
    val brlPyg: Double,
    val status: Status = Status.ATIVO,
)

@Serializable
data class CotacaoResponse(
    val id: Long,
    val data: String,
    val usdPyg: Double,
    val brlPyg: Double,
    val status: Status,
)
