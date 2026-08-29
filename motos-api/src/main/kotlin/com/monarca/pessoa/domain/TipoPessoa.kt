package com.monarca.pessoa.domain

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
enum class TipoPessoa {
    @SerialName("fisica")
    FISICA,

    @SerialName("juridica")
    JURIDICA,
}
