package com.monarca.pessoa.domain

data class PessoaCompleta(
    val pessoa: Pessoa,
    val documentos: List<PessoaDocumentoDetalhe>,
)
