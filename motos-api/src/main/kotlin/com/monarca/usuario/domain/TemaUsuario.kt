package com.monarca.usuario.domain

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
enum class TemaUsuario {
    @SerialName("escuro")
    ESCURO,

    @SerialName("claro")
    CLARO,
}
