package com.monarca.auth.domain

import com.monarca.usuario.domain.PerfilUsuario
import io.ktor.server.auth.Principal

data class UsuarioAutenticado(
    val id: Long,
    val login: String,
    val perfil: PerfilUsuario,
    val permissoes: Set<String>,
) : Principal
