package com.monarca.caixa.domain

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
enum class TipoFinalizador {
    @SerialName("dinheiro")
    DINHEIRO,

    @SerialName("cartao")
    CARTAO,

    @SerialName("deposito")
    DEPOSITO,

    @SerialName("cheque")
    CHEQUE,

    @SerialName("outro")
    OUTRO,
}

@Serializable
enum class TipoMovimentacaoCaixa {
    @SerialName("abertura")
    ABERTURA,

    @SerialName("fechamento")
    FECHAMENTO,

    @SerialName("venda")
    VENDA,

    @SerialName("transferencia_saida")
    TRANSFERENCIA_SAIDA,

    @SerialName("transferencia_entrada")
    TRANSFERENCIA_ENTRADA,
}

@Serializable
enum class StatusSessaoCaixa {
    @SerialName("aberto")
    ABERTO,

    @SerialName("fechado")
    FECHADO,
}
