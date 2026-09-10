package com.monarca.produto.domain

data class ProdutoEstoqueSaldo(
    val idEstoque: Long,
    val estoqueNome: String,
    val quantidade: Int,
    val quantidadeReservada: Int,
    val padrao: Boolean = false,
) {
    val quantidadeDisponivel: Int get() = quantidade - quantidadeReservada
}

data class ProdutoSaldoTotal(
    val quantidade: Int,
    val quantidadeReservada: Int,
) {
    val quantidadeDisponivel: Int get() = quantidade - quantidadeReservada
}
