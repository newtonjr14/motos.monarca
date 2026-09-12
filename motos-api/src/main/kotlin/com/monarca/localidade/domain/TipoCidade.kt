package com.monarca.localidade.domain

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
enum class TipoCidade {
    @SerialName("municipio")
    MUNICIPIO,

    @SerialName("distrito")
    DISTRITO,
}
