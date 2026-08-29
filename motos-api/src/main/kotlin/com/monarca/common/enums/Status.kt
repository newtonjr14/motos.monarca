package com.monarca.common.enums

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
enum class Status {
    @SerialName("ativo")
    ATIVO,

    @SerialName("inativo")
    INATIVO,

    @SerialName("deletado")
    DELETADO
}