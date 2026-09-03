package com.monarca.localidade.service

class RecursoNaoEncontrado(
    message: String,
    val codigo: String = "NAO_ENCONTRADO",
    val params: Map<String, String> = emptyMap(),
) : RuntimeException(message)

class RequisicaoInvalida(
    val codigo: String,
    message: String,
    val params: Map<String, String> = emptyMap(),
) : RuntimeException(message)

class AcessoNegado(
    message: String = "Acesso negado",
    val codigo: String = "ACESSO_NEGADO",
    val params: Map<String, String> = emptyMap(),
) : RuntimeException(message)

fun invalido(codigo: String, message: String, vararg params: Pair<String, Any?>): RequisicaoInvalida =
    RequisicaoInvalida(
        codigo = codigo,
        message = message,
        params = params.mapNotNull { (chave, valor) -> valor?.let { chave to it.toString() } }.toMap(),
    )

fun acesso(codigo: String, message: String, vararg params: Pair<String, Any?>): AcessoNegado =
    AcessoNegado(
        message = message,
        codigo = codigo,
        params = params.mapNotNull { (chave, valor) -> valor?.let { chave to it.toString() } }.toMap(),
    )
