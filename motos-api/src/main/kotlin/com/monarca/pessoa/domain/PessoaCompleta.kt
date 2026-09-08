package com.monarca.pessoa.domain

data class PessoaCompleta(
    val pessoa: Pessoa,
    val documentos: List<PessoaDocumentoDetalhe>,
    val enderecos: List<PessoaEndereco> = emptyList(),
)
