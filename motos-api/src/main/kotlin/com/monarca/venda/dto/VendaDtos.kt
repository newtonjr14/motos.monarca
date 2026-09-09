package com.monarca.venda.dto

import com.monarca.produto.domain.Moeda
import com.monarca.venda.domain.StatusVenda
import kotlinx.serialization.Serializable

@Serializable
data class VendaItemRequest(
    val idProduto: Long,
    val idEstoque: Long? = null,
    val quantidade: Int,
)

@Serializable
data class VendaNegociacaoRequest(
    val idFinalizador: Long,
    val valor: Double,
    val moeda: Moeda = Moeda.PYG,
)

@Serializable
data class VendaRequest(
    val idFilial: Long? = null,
    val idCliente: Long,
    val idVendedor: Long? = null,
    val idCaixaSessao: Long? = null,
    val itens: List<VendaItemRequest>,
    val negociacao: List<VendaNegociacaoRequest>,
    val observacao: String? = null,
)

@Serializable
data class VendedorOpcaoResponse(
    val id: Long,
    val nome: String,
)

@Serializable
data class VendaItemResponse(
    val id: Long,
    val idProduto: Long,
    val produtoCodigo: String,
    val produtoNome: String,
    val idEstoque: Long,
    val estoqueNome: String,
    val quantidade: Int,
    val aliquotaIva: Int,
    val moedaPreco: String,
    val precoLista: Double,
    val precoUnitarioPyg: Double,
    val totalPyg: Double,
)

@Serializable
data class VendaNegociacaoResponse(
    val id: Long,
    val idFinalizador: Long,
    val finalizadorNome: String,
    val moeda: Moeda,
    val valor: Double,
    val valorPyg: Double,
)

@Serializable
data class VendaResponse(
    val id: Long,
    val idFilial: Long,
    val filialNome: String,
    val idCliente: Long,
    val clienteNome: String,
    val idVendedor: Long,
    val vendedorNome: String,
    val idCaixaSessao: Long,
    val idCotacao: Long,
    val totalPyg: Double,
    val observacao: String? = null,
    val criadoEm: Long,
    val status: StatusVenda,
    val itens: List<VendaItemResponse>,
    val negociacao: List<VendaNegociacaoResponse>,
)
