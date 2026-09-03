package com.monarca.common.dto

import kotlinx.serialization.Serializable

@Serializable
data class MensagemErro(
    val codigo: String,
    val message: String,
    val params: Map<String, String> = emptyMap(),
)
