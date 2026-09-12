package com.monarca.localidade.domain

import com.monarca.common.enums.Status

data class Cidade(
    val id: Long,
    val idDivisao: Long,
    val nome: String,
    val tipo: TipoCidade,
    val idCidadeMunicipio: Long?,
    val status: Status,
)
