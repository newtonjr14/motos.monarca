package com.monarca.empresa.domain

data class FilialDetalhe(
    val filial: Filial,
    val empresaRazaoSocial: String,
    val empresaNomeFantasia: String,
    val cidadeNome: String?,
    val divisaoNome: String?,
    val divisaoSigla: String?,
    val paisNome: String?,
)
