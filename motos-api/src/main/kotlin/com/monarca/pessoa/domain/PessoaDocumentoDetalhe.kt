package com.monarca.pessoa.domain

data class PessoaDocumentoDetalhe(
    val documento: PessoaDocumento,
    val tipo: DocumentoTipo?,
    val paisSigla: String,
    val paisNome: String,
)
