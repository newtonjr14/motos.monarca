package com.monarca.localidade.domain

data class CidadeDetalhe(
    val cidade: Cidade,
    val divisao: Divisao,
    val pais: Pais,
    val municipioNome: String? = null,
)
