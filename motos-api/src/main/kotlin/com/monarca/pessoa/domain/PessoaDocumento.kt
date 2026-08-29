package com.monarca.pessoa.domain

data class PessoaDocumento(
    val id: Long,
    val idPessoa: Long,
    val idPais: Long,
    val idTipoDocumento: Long?,
    val tipoLivre: String?,
    val numero: String,
)
