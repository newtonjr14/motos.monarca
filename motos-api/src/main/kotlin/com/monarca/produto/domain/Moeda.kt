package com.monarca.produto.domain

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
enum class Moeda {
    @SerialName("usd")
    USD,

    @SerialName("pyg")
    PYG,

    @SerialName("brl")
    BRL,
}
