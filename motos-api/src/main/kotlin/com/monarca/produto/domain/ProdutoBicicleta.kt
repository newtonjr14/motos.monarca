package com.monarca.produto.domain

data class ProdutoBicicleta(
    val id: Long,
    val idProduto: Long,
    val cor: String?,
    val potenciaMotorW: Int?,
    val autonomiaKm: Int?,
    val capacidadeBateriaAh: Double?,
    val voltagemBateria: Int?,
    val tempoCargaHoras: Double?,
    val pesoKg: Double?,
    val aro: String?,
    val tipoQuadro: String?,
    val numeroMarchas: Int?,
    val tipoFreio: String?,
    val numeroSerieQuadro: String?,
)
