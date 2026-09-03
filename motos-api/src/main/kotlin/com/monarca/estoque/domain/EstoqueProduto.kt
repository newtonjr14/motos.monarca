package com.monarca.estoque.domain

import com.monarca.common.enums.Status
import com.monarca.produto.domain.TipoProduto

data class EstoqueProduto(
    val id: Long,
    val idEstoque: Long,
    val idProduto: Long,
    val quantidade: Int,
    val quantidadeReservada: Int,
    val status: Status,
)

data class EstoqueProdutoDetalhe(
    val item: EstoqueProduto,
    val estoqueNome: String,
    val idFilial: Long,
    val filialNome: String,
    val produtoCodigo: String,
    val produtoNome: String,
    val produtoTipo: TipoProduto,
)
