package com.monarca.titulo.domain

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
enum class OrigemTitulo {
    @SerialName("venda")
    VENDA,

    @SerialName("manual")
    MANUAL,

    @SerialName("compra")
    COMPRA,
}

@Serializable
enum class StatusTitulo {
    @SerialName("aberto")
    ABERTO,

    @SerialName("parcial")
    PARCIAL,

    @SerialName("quitado")
    QUITADO,

    @SerialName("cancelado")
    CANCELADO,
}

@Serializable
enum class StatusParcela {
    @SerialName("aberta")
    ABERTA,

    @SerialName("parcial")
    PARCIAL,

    @SerialName("paga")
    PAGA,

    @SerialName("cancelada")
    CANCELADA,
}

@Serializable
enum class ModoVencimento {
    @SerialName("intervalo_30")
    INTERVALO_30,

    @SerialName("dia_fixo")
    DIA_FIXO,
}
