package com.monarca.estoque.dto

import com.monarca.common.enums.Status
import com.monarca.produto.domain.TipoProduto
import kotlinx.serialization.Serializable

@Serializable
data class EstoqueRequest(
    val idFilial: Long? = null,
    val nome: String,
    val status: Status = Status.ATIVO,
)

@Serializable
data class EstoqueResponse(
    val id: Long,
    val idFilial: Long,
    val filialNome: String,
    val nome: String,
    val status: Status,
)

@Serializable
data class EstoqueProdutoRequest(
    val idEstoque: Long,
    val idProduto: Long,
    val quantidade: Int,
    val quantidadeReservada: Int = 0,
    val status: Status = Status.ATIVO,
)

@Serializable
data class EstoqueProdutoResponse(
    val id: Long,
    val idEstoque: Long,
    val estoqueNome: String,
    val idFilial: Long,
    val filialNome: String,
    val idProduto: Long,
    val produtoCodigo: String,
    val produtoNome: String,
    val produtoTipo: TipoProduto,
    val quantidade: Int,
    val quantidadeReservada: Int,
    val quantidadeDisponivel: Int,
    val status: Status,
)
