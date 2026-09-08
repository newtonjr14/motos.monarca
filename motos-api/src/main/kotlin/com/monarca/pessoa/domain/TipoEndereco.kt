package com.monarca.pessoa.domain

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
enum class TipoEndereco {
    @SerialName("fiscal")
    FISCAL,

    @SerialName("residencial")
    RESIDENCIAL,

    @SerialName("entrega")
    ENTREGA,
}
