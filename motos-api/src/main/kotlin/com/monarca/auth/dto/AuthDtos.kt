package com.monarca.auth.dto

import com.monarca.usuario.domain.IdiomaUsuario
import com.monarca.usuario.domain.PerfilUsuario
import kotlinx.serialization.Serializable

@Serializable
data class LoginRequest(
    val login: String,
    val senha: String,
)

@Serializable
data class RefreshRequest(
    val refreshToken: String,
)

@Serializable
data class TokenResponse(
    val accessToken: String,
    val refreshToken: String,
    val tokenType: String = "Bearer",
    val expiresIn: Long,
)

@Serializable
data class PerfilAutenticadoResponse(
    val id: Long,
    val nome: String,
    val login: String,
    val email: String,
    val perfil: PerfilUsuario,
    val idioma: IdiomaUsuario,
    val permissoes: List<String>,
)

@Serializable
data class AlterarSenhaRequest(
    val senhaAtual: String,
    val senhaNova: String,
)

@Serializable
data class EditarPerfilRequest(
    val nome: String,
    val idioma: IdiomaUsuario,
)

@Serializable
data class MensagemErro(
    val message: String,
)
