package com.monarca.produto.domain

import com.monarca.pessoa.domain.FilialVinculo

data class ProdutoCompleto(
    val produto: Produto,
    val filialNome: String?,
    val filiaisVinculadas: List<FilialVinculo>,
    val moto: ProdutoMoto?,
    val bicicleta: ProdutoBicicleta?,
)
