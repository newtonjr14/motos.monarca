package com.monarca.auth.repository

import org.jetbrains.exposed.v1.core.Table

object RefreshTokensTable : Table("refresh_token") {
    val id = varchar("id", 36)
    val idUsuario = long("id_usuario")
    val tokenHash = varchar("token_hash", 255)
    val expiresAt = long("expires_at")
    val createdAt = long("created_at")

    override val primaryKey = PrimaryKey(id)
}
