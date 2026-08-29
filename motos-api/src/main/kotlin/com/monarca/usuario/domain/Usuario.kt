package com.monarca.usuario.domain

import com.monarca.common.enums.Status

data class Usuario(
    val id: Long,
    val nome: String,
    val login: String,
    val email: String,
    val senhaHash: String,
    val perfil: PerfilUsuario,
    val idioma: IdiomaUsuario,
    val status: Status,
)
