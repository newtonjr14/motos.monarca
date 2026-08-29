package com.monarca.pessoa.domain

data class DocumentoTipo(
    val id: Long,
    val idPais: Long,
    val tipoPessoa: TipoPessoa,
    val codigo: String,
    val nome: String,
    val unico: Boolean,
)
