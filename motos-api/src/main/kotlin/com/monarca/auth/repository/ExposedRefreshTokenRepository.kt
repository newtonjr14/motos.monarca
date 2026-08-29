package com.monarca.auth.repository

import java.util.UUID
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.singleOrNull
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.r2dbc.R2dbcDatabase
import org.jetbrains.exposed.v1.r2dbc.deleteWhere
import org.jetbrains.exposed.v1.r2dbc.insert
import org.jetbrains.exposed.v1.r2dbc.selectAll
import org.jetbrains.exposed.v1.r2dbc.transactions.suspendTransaction

class ExposedRefreshTokenRepository(
    private val database: R2dbcDatabase,
) : RefreshTokenRepository {

    override suspend fun salvar(
        idUsuario: Long,
        tokenHash: String,
        expiresAt: Long,
        createdAt: Long,
    ): String = suspendTransaction(database) {
        val id = UUID.randomUUID().toString()
        RefreshTokensTable.insert {
            it[RefreshTokensTable.id] = id
            it[RefreshTokensTable.idUsuario] = idUsuario
            it[RefreshTokensTable.tokenHash] = tokenHash
            it[RefreshTokensTable.expiresAt] = expiresAt
            it[RefreshTokensTable.createdAt] = createdAt
        }
        id
    }

    override suspend fun buscarPorHash(tokenHash: String): RefreshTokenRecord? =
        suspendTransaction(database) {
            RefreshTokensTable.selectAll()
                .where { RefreshTokensTable.tokenHash eq tokenHash }
                .map {
                    RefreshTokenRecord(
                        id = it[RefreshTokensTable.id],
                        idUsuario = it[RefreshTokensTable.idUsuario],
                        tokenHash = it[RefreshTokensTable.tokenHash],
                        expiresAt = it[RefreshTokensTable.expiresAt],
                    )
                }
                .singleOrNull()
        }

    override suspend fun revogar(tokenHash: String) {
        suspendTransaction(database) {
            RefreshTokensTable.deleteWhere { RefreshTokensTable.tokenHash eq tokenHash }
        }
    }

    override suspend fun revogarTodos(idUsuario: Long) {
        suspendTransaction(database) {
            RefreshTokensTable.deleteWhere { RefreshTokensTable.idUsuario eq idUsuario }
        }
    }
}
