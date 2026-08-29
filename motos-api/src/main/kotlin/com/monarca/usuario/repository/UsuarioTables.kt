package com.monarca.usuario.repository

import org.jetbrains.exposed.v1.core.dao.id.LongIdTable

object UsuariosTable : LongIdTable("usuario") {
    val nome = varchar("nome", 180)
    val login = varchar("login", 80).uniqueIndex()
    val email = varchar("email", 120).uniqueIndex()
    val senhaHash = varchar("senha_hash", 255)
    val perfil = varchar("perfil", 20)
    val idioma = varchar("idioma", 5).default("pt")
    val status = varchar("status", 20).default("ativo")
}
