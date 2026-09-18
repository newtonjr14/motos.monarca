package com.monarca.titulo.domain

import com.monarca.produto.domain.Moeda

data class TituloReceber(
    val id: Long,
    val idFilial: Long,
    val idCliente: Long,
    val origem: OrigemTitulo,
    val idVenda: Long?,
    val moeda: Moeda,
    val valor: Double,
    val valorPyg: Double,
    val idCotacao: Long,
    val usdPyg: Double,
    val brlPyg: Double,
    val observacao: String?,
    val criadoEm: Long,
    val status: StatusTitulo,
)

data class TituloPagar(
    val id: Long,
    val idFilial: Long,
    val idFornecedor: Long,
    val origem: OrigemTitulo,
    val moeda: Moeda,
    val valor: Double,
    val valorPyg: Double,
    val idCotacao: Long,
    val usdPyg: Double,
    val brlPyg: Double,
    val observacao: String?,
    val criadoEm: Long,
    val status: StatusTitulo,
)

data class ParcelaTitulo(
    val id: Long,
    val idTitulo: Long,
    val numero: Int,
    val vencimento: String,
    val valor: Double,
    val valorPyg: Double,
    val saldo: Double,
    val status: StatusParcela,
)

data class BaixaTitulo(
    val id: Long,
    val idParcela: Long,
    val idFinalizador: Long,
    val idCaixaSessao: Long,
    val moeda: Moeda,
    val valor: Double,
    val valorPyg: Double,
    val idUsuario: Long,
    val criadoEm: Long,
    val observacao: String?,
)
