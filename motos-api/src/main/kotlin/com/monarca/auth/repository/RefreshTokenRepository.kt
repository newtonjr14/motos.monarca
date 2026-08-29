package com.monarca.auth.repository

interface RefreshTokenRepository {
    suspend fun salvar(idUsuario: Long, tokenHash: String, expiresAt: Long, createdAt: Long): String
    suspend fun buscarPorHash(tokenHash: String): RefreshTokenRecord?
    suspend fun revogar(tokenHash: String)
    suspend fun revogarTodos(idUsuario: Long)
}

data class RefreshTokenRecord(
    val id: String,
    val idUsuario: Long,
    val tokenHash: String,
    val expiresAt: Long,
)
