package com.monarca.venda.domain

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
enum class StatusVenda {
    @SerialName("finalizada")
    FINALIZADA,

    @SerialName("cancelada")
    CANCELADA,
}

data class Venda(
    val id: Long,
    val idFilial: Long,
    val idCliente: Long,
    val idVendedor: Long,
    val idCaixaSessao: Long,
    val idCotacao: Long,
    val totalPyg: Double,
    val observacao: String?,
    val criadoEm: Long,
    val status: StatusVenda,
)

data class VendaItem(
    val id: Long,
    val idVenda: Long,
    val idProduto: Long,
    val idEstoque: Long,
    val quantidade: Int,
    val aliquotaIva: Int,
    val moedaPreco: String,
    val precoLista: Double,
    val precoUnitarioPyg: Double,
    val totalPyg: Double,
)

data class VendaNegociacao(
    val id: Long,
    val idVenda: Long,
    val idFinalizador: Long,
    val valor: Double,
)
