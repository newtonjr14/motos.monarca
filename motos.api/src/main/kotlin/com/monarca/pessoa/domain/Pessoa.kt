package com.monarca.pessoa.domain

data class Pessoa(
    val id: Long,
    val nomeRazaoSocial: String,
    val ddi: String? = null,
    val telefone: String? = null,
    val email: String? = null,
    val tipoLogradouro: String? = null,
    val logradouro: String? = null,
    val numero: String? = null,
    val bairro: String? = null,
    val cep: String? = null,
    val complemento: String? = null,
) 
