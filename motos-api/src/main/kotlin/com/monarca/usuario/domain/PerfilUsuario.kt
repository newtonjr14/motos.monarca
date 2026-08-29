package com.monarca.usuario.domain

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
enum class PerfilUsuario {
    @SerialName("administrador")
    ADMINISTRADOR,

    @SerialName("gestor")
    GESTOR,

    @SerialName("operador")
    OPERADOR,

    @SerialName("vendedor")
    VENDEDOR,
}
