package com.monarca.produto.domain

import com.monarca.common.enums.Status

data class Produto(
    val id: Long,
    val codigo: String,
    val nome: String,
    val idMarca: Long,
    val idModelo: Long,
    val marcaNome: String = "",
    val modeloNome: String = "",
    val descricao: String?,
    val tipo: TipoProduto,
    val idFilialCadastro: Long?,
    val aliquotaIva: Int,
    val moedaPreco: Moeda,
    val precoLista: Double,
    val custo: Double,
    val status: Status,
)
