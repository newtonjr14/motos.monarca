package com.monarca.produto.domain

data class ProdutoUnidade(
    val id: Long,
    val idProduto: Long,
    val idEstoque: Long,
    val estoqueNome: String,
    val numero: String,
    val situacao: SituacaoUnidade,
    val idVendaItem: Long?,
)
