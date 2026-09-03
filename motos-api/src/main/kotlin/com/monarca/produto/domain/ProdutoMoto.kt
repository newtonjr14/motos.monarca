package com.monarca.produto.domain

data class ProdutoMoto(
    val id: Long,
    val idProduto: Long,
    val chassi: String?,
    val cor: String?,
    val potenciaMotorW: Int?,
    val autonomiaKm: Int?,
    val velocidadeMaxKmh: Int?,
    val capacidadeBateriaAh: Double?,
    val voltagemBateria: Int?,
    val tempoCargaHoras: Double?,
    val pesoKg: Double?,
    val capacidadeCargaKg: Int?,
    val assentos: Int?,
    val tipoFreio: String?,
    val anoFabricacao: Int,
    val anoModelo: Int,
)
