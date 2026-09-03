package com.monarca.produto.domain

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
enum class TipoProduto {
    @SerialName("moto")
    MOTO,

    @SerialName("bicicleta")
    BICICLETA,
}
