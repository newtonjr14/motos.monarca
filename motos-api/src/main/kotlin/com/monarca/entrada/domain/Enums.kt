package com.monarca.entrada.domain

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
enum class TipoDocumentoEntrada {
    @SerialName("py_factura")
    PY_FACTURA,

    @SerialName("exterior")
    EXTERIOR,
}

@Serializable
enum class CondicionEntrada {
    @SerialName("contado")
    CONTADO,

    @SerialName("credito")
    CREDITO,
}

@Serializable
enum class StatusEntrada {
    @SerialName("finalizada")
    FINALIZADA,

    @SerialName("cancelada")
    CANCELADA,
}
