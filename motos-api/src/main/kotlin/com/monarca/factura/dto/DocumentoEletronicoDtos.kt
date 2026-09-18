package com.monarca.factura.dto

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonObject

/**
 * Contrato SudTax 2026-09-17 — `POST /documentos`.
 * Genérico para qualquer ERP; Monarca é o primeiro cliente.
 */
@Serializable
data class SudtaxDocumentoRequest(
    val tipo: String = "factura",
    val referencia: String,
    val estabelecimento: String? = null,
    val pontoExpedicao: String? = null,
    val dados: SudtaxDocumentoDados,
)

@Serializable
data class SudtaxDocumentoDados(
    val tipoOperacion: String = "mercaderia",
    val condicion: String = "contado",
    val receptor: SudtaxReceptor,
    val itens: List<SudtaxItem>,
)

@Serializable
data class SudtaxReceptor(
    val ruc: String,
    val nome: String,
)

@Serializable
data class SudtaxItem(
    val codigo: String,
    val descripcion: String,
    val cantidad: Int,
    val precioUnitario: Long,
    val iva: Int,
)

@Serializable
data class SudtaxDocumentoResponse(
    val id: Long,
    val estado: String,
    val cdc: String? = null,
    val cdcFormatado: String? = null,
    val referencia: String? = null,
    val mensaje: String? = null,
    val protocoloLote: String? = null,
    val codigoSifen: String? = null,
    val criadoEm: Long? = null,
    val atualizadoEm: Long? = null,
)

@Serializable
data class SudtaxErroResponse(
    val codigo: String? = null,
    val mensagem: String? = null,
    val message: String? = null,
)

@Serializable
data class DocumentoEletronicoPreviewResponse(
    val idVenda: Long,
    val pronto: Boolean,
    val avisos: List<String> = emptyList(),
    val documento: SudtaxDocumentoRequest? = null,
    val payload: JsonObject? = null,
)
