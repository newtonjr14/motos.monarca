package com.monarca.pessoa.domain

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
enum class StatusClienteFornecedor {
    @SerialName("ativo")
    ATIVO,

    @SerialName("inativo")
    INATIVO
}