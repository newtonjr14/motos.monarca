package com.monarca.produto.domain

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
enum class SituacaoUnidade {
    @SerialName("disponivel")
    DISPONIVEL,

    @SerialName("vendido")
    VENDIDO,
}
