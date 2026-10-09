package com.monarca.venda.dto

import com.monarca.produto.domain.Moeda
import com.monarca.titulo.dto.ParcelasConfigRequest
import com.monarca.venda.domain.StatusVenda
import kotlinx.serialization.Serializable

@Serializable
data class VendaItemRequest(
    val idProduto: Long,
    val idEstoque: Long? = null,
    val quantidade: Int,
    val idsUnidades: List<Long> = emptyList(),
    /** Percentual 0–100. Exige permissão venda:desconto se > 0. */
    val descontoPct: Double = 0.0,
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
    /** Percentual 0–100 sobre o total dos itens. Exige permissão venda:desconto se > 0. */
    val descontoPct: Double = 0.0,
    val parcelas: ParcelasConfigRequest? = null,
    val observacao: String? = null,
    /** venda, orcamento ou aberta. */
    val gravacao: String = "venda",
    /** Data ISO. Obrigatória no orçamento. */
    val validade: String? = null,
    /** Converte orçamento vencido usando a cotação de hoje. */
    val confirmarVencido: Boolean = false,
    /** Orçamentos que esta venda consome ao ser finalizada. */
    val idsOrcamentos: List<Long> = emptyList(),
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
    val descontoPct: Double = 0.0,
    val descontoPyg: Double = 0.0,
    val totalPyg: Double,
    val chassis: List<String> = emptyList(),
)

@Serializable
data class VendaNegociacaoResponse(
    val id: Long,
    val idFinalizador: Long,
    val finalizadorNome: String,
    val moeda: Moeda,
    val valor: Double,
    val valorPyg: Double,
    val quantidadeParcelas: Int? = null,
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
    val clienteEndereco: String? = null,
    val clienteTelefone: String? = null,
    val validade: String? = null,
    val idVendaGerada: Long? = null,
    val idsOrcamentos: List<Long> = emptyList(),
    val usdPyg: Double,
    val brlPyg: Double,
    val totalPyg: Double,
    val descontoPct: Double = 0.0,
    val descontoPyg: Double = 0.0,
    val observacao: String? = null,
    val criadoEm: Long,
    val finalizadaEm: Long? = null,
    val status: StatusVenda,
    val itens: List<VendaItemResponse>,
    val negociacao: List<VendaNegociacaoResponse>,
)
