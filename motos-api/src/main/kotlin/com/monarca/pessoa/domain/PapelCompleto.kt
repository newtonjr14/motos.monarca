package com.monarca.pessoa.domain

import com.monarca.common.enums.Status

data class PapelCompleto(
    val id: Long,
    val idPessoa: Long,
    val idFilialCadastro: Long?,
    val filialNome: String?,
    val filiaisVinculadas: List<FilialVinculo>,
    val status: Status,
    val observacao: String?,
    val pessoa: PessoaCompleta,
)
