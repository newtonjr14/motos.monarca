package com.monarca.factura.dto

import kotlinx.serialization.Serializable

@Serializable
data class FacturaEmitirRequest(
    val idVenda: Long,
    /** Se true, após criar na SudTax já chama POST /enviar. */
    val enviar: Boolean = true,
)

@Serializable
data class FacturaResumoResponse(
    val id: Long,
    val idFilial: Long,
    val idVenda: Long,
    val referencia: String,
    val sudtaxId: Long?,
    val cdc: String?,
    val cdcFormatado: String?,
    val estado: String,
    val mensagem: String?,
    val protocoloLote: String?,
    val codigoSifen: String?,
    val estabelecimento: String?,
    val pontoExpedicao: String?,
    val clienteNome: String,
    val totalPyg: Double,
    val criadoEm: Long,
    val atualizadoEm: Long,
)

@Serializable
data class FacturaResponse(
    val id: Long,
    val idFilial: Long,
    val idVenda: Long,
    val referencia: String,
    val sudtaxId: Long?,
    val cdc: String?,
    val cdcFormatado: String?,
    val estado: String,
    val mensagem: String?,
    val protocoloLote: String?,
    val codigoSifen: String?,
    val estabelecimento: String?,
    val pontoExpedicao: String?,
    val clienteNome: String,
    val totalPyg: Double,
    val payloadEnvio: String?,
    val criadoEm: Long,
    val atualizadoEm: Long,
)

@Serializable
data class VendaElegivelFacturaResponse(
    val id: Long,
    val clienteNome: String,
    val totalPyg: Double,
    val criadoEm: Long,
)
