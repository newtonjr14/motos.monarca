package com.monarca.empresa.domain

import com.monarca.common.enums.Status

data class Empresa(
    val id: Long,
    val razaoSocial: String,
    val nomeFantasia: String,
    val ruc: String,
    val representanteNome: String?,
    val representanteDocumento: String?,
    val status: Status,
)
