package com.monarca.usuario.dto

import com.monarca.common.enums.Status
import com.monarca.usuario.domain.IdiomaUsuario
import com.monarca.usuario.domain.PerfilUsuario
import kotlinx.serialization.Serializable

@Serializable
data class FilialAcessoResponse(
    val id: Long,
    val nome: String,
    val principal: Boolean,
)

@Serializable
data class UsuarioResponse(
    val id: Long,
    val nome: String,
    val login: String,
    val email: String,
    val perfil: PerfilUsuario,
    val idioma: IdiomaUsuario,
    val status: Status,
    val filiais: List<FilialAcessoResponse> = emptyList(),
)

@Serializable
data class UsuarioRequest(
    val nome: String,
    val login: String,
    val email: String,
    val senha: String? = null,
    val perfil: PerfilUsuario,
    val idioma: IdiomaUsuario = IdiomaUsuario.PT,
    val status: Status = Status.ATIVO,
    val idsFiliais: List<Long>? = null,
)
