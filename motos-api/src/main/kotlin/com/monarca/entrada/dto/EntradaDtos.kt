package com.monarca.entrada.dto

import com.monarca.entrada.domain.CondicionEntrada
import com.monarca.entrada.domain.StatusEntrada
import com.monarca.entrada.domain.TipoDocumentoEntrada
import com.monarca.produto.domain.Moeda
import com.monarca.titulo.dto.ParcelasConfigRequest
import kotlinx.serialization.Serializable

@Serializable
data class EntradaItemRequest(
    val idProduto: Long,
    val idEstoque: Long? = null,
    val quantidade: Int = 0,
    val valorUnitario: Double,
    val numerosChassis: List<String> = emptyList(),
)

@Serializable
data class EntradaNegociacaoRequest(
    val idFinalizador: Long,
    val valor: Double,
    val moeda: Moeda = Moeda.PYG,
)

@Serializable
data class EntradaRequest(
    val idFilial: Long? = null,
    val idFornecedor: Long,
    val tipoDocumento: TipoDocumentoEntrada,
    val dataEmissao: String,
    val moeda: Moeda = Moeda.PYG,
    val idCaixaSessao: Long? = null,
    val timbrado: String? = null,
    val establecimiento: String? = null,
    val puntoExpedicion: String? = null,
    val numero: String? = null,
    val cdc: String? = null,
    val condicion: CondicionEntrada? = null,
    val numeroDocumento: String? = null,
    val incoterm: String? = null,
    val itens: List<EntradaItemRequest>,
    val negociacao: List<EntradaNegociacaoRequest>,
    val parcelas: ParcelasConfigRequest? = null,
    val observacao: String? = null,
)

@Serializable
data class EntradaItemResponse(
    val id: Long,
    val idProduto: Long,
    val produtoCodigo: String,
    val produtoNome: String,
    val idEstoque: Long,
    val estoqueNome: String,
    val quantidade: Int,
    val aliquotaIva: Int,
    val moeda: Moeda,
    val valorUnitario: Double,
    val valor: Double,
    val valorPyg: Double,
    val chassis: List<String> = emptyList(),
)

@Serializable
data class EntradaNegociacaoResponse(
    val id: Long,
    val idFinalizador: Long,
    val finalizadorNome: String,
    val moeda: Moeda,
    val valor: Double,
    val valorPyg: Double,
)

@Serializable
data class EntradaResumoResponse(
    val id: Long,
    val idFilial: Long,
    val idFornecedor: Long,
    val fornecedorNome: String,
    val tipoDocumento: TipoDocumentoEntrada,
    val dataEmissao: String,
    val moeda: Moeda,
    val valor: Double,
    val valorPyg: Double,
    val documentoLabel: String,
    val criadoEm: Long,
    val status: StatusEntrada,
)

@Serializable
data class EntradaResponse(
    val id: Long,
    val idFilial: Long,
    val filialNome: String,
    val idFornecedor: Long,
    val fornecedorNome: String,
    val tipoDocumento: TipoDocumentoEntrada,
    val dataEmissao: String,
    val moeda: Moeda,
    val valor: Double,
    val valorPyg: Double,
    val idCotacao: Long,
    val usdPyg: Double,
    val brlPyg: Double,
    val timbrado: String? = null,
    val establecimiento: String? = null,
    val puntoExpedicion: String? = null,
    val numero: String? = null,
    val cdc: String? = null,
    val condicion: CondicionEntrada? = null,
    val numeroDocumento: String? = null,
    val incoterm: String? = null,
    val idCaixaSessao: Long? = null,
    val idTituloPagar: Long? = null,
    val observacao: String? = null,
    val criadoEm: Long,
    val status: StatusEntrada,
    val itens: List<EntradaItemResponse>,
    val negociacao: List<EntradaNegociacaoResponse>,
)
