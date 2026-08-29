package com.monarca.localidade.dto

import com.monarca.common.enums.Status
import kotlinx.serialization.Serializable

@Serializable
data class PaisResponse(
    val id: Long,
    val nome: String,
    val sigla: String,
    val usaSiglaDivisao: Boolean,
    val status: Status,
)

@Serializable
data class PaisRequest(
    val nome: String,
    val sigla: String,
    val usaSiglaDivisao: Boolean,
    val status: Status = Status.ATIVO,
)

@Serializable
data class DivisaoResponse(
    val id: Long,
    val idPais: Long,
    val nome: String,
    val sigla: String? = null,
    val status: Status,
)

@Serializable
data class CidadeResponse(
    val id: Long,
    val nome: String,
    val idDivisao: Long,
    val divisaoNome: String,
    val divisaoSigla: String? = null,
    val idPais: Long,
    val paisNome: String,
    val paisSigla: String,
    val status: Status,
)

@Serializable
data class DivisaoRequest(
    val nome: String,
    val idPais: Long,
    val sigla: String? = null,
    val status: Status = Status.ATIVO,
)

@Serializable
data class CidadeRequest(
    val nome: String,
    val idDivisao: Long,
    val status: Status = Status.ATIVO,
)

@Serializable
data class MensagemErro(
    val message: String,
)
