package com.monarca.factura.sudtax

data class SudtaxConfig(
    val enabled: Boolean,
    val baseUrl: String,
    val apiKey: String,
)
