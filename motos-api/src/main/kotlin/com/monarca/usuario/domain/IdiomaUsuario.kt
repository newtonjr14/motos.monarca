package com.monarca.usuario.domain

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
enum class IdiomaUsuario {
    @SerialName("pt")
    PT,

    @SerialName("es")
    ES,
}
