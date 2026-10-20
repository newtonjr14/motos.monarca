package com.monarca.devolucao.dto

import com.monarca.produto.domain.Moeda
import kotlinx.serialization.Serializable

@Serializable
data class DevolucaoItemRequest(
    val idVendaItem: Long,
    val quantidade: Int = 0,
    val idsUnidades: List<Long> = emptyList(),
)

@Serializable
data class DevolucaoRequest(
    val idFilial: Long? = null,
    val idVenda: Long,
    val itens: List<DevolucaoItemRequest> = emptyList(),
    val tratamento: String? = null,
    val idFinalizador: Long? = null,
    val moedaCaixa: Moeda? = null,
    val idCaixaSessao: Long? = null,
    val observacao: String? = null,
)

@Serializable
data class ChassisDevolucaoResponse(
    val id: Long,
    val numero: String,
)

@Serializable
data class DevolucaoItemDisponivelResponse(
    val idVendaItem: Long,
    val produtoCodigo: String,
    val produtoNome: String,
    val controlaChassi: Boolean,
    val quantidadeVendida: Int,
    val quantidadeDevolvida: Int,
    val quantidadeDisponivel: Int,
    val totalPyg: Double,
    val chassis: List<ChassisDevolucaoResponse>,
)

@Serializable
data class DevolucaoPreviewResponse(
    val idVenda: Long,
    val idCliente: Long,
    val clienteNome: String,
    val totalPyg: Double,
    val abertoPyg: Double,
    val usdPyg: Double,
    val brlPyg: Double,
    val itens: List<DevolucaoItemDisponivelResponse>,
)

@Serializable
data class DevolucaoItemResponse(
    val id: Long,
    val produtoCodigo: String,
    val produtoNome: String,
    val quantidade: Int,
    val valorPyg: Double,
    val chassis: List<String>,
)

@Serializable
data class DevolucaoResponse(
    val id: Long,
    val idVenda: Long,
    val clienteNome: String,
    val valorPyg: Double,
    val abatidoPyg: Double,
    val excessoPyg: Double,
    val tratamento: String,
    val criadoEm: Long,
    val itens: List<DevolucaoItemResponse>,
)

@Serializable
data class CreditoClienteResponse(
    val saldoPyg: Double,
)
