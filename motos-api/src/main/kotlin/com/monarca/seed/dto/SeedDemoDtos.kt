package com.monarca.seed.dto

import kotlinx.serialization.Serializable

@Serializable
data class SeedDemoStatusResponse(
    val aplicado: Boolean,
    val clientes: Int = 0,
    val produtos: Int = 0,
    val vendas: Int = 0,
    val caixas: Int = 0,
    val finalizadores: Int = 0,
)
