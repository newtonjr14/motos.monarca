package com.monarca.usuario.repository

import com.monarca.common.enums.Status
import com.monarca.usuario.domain.IdiomaUsuario
import com.monarca.usuario.domain.PerfilUsuario
import com.monarca.usuario.domain.Usuario

interface UsuarioRepository {
    suspend fun inicializar()

    suspend fun listar(): List<Usuario>
    suspend fun buscar(id: Long): Usuario?
    suspend fun buscarPorLogin(login: String): Usuario?
    suspend fun existePorEmail(email: String, ignorarId: Long? = null): Boolean
    suspend fun existePorLogin(login: String, ignorarId: Long? = null): Boolean
    suspend fun inserir(
        nome: String,
        login: String,
        email: String,
        senhaHash: String,
        perfil: PerfilUsuario,
        idioma: IdiomaUsuario,
        status: Status,
    ): Long
    suspend fun atualizar(
        id: Long,
        nome: String,
        login: String,
        email: String,
        senhaHash: String,
        perfil: PerfilUsuario,
        idioma: IdiomaUsuario,
        status: Status,
    ): Boolean
    suspend fun atualizarSenha(id: Long, senhaHash: String): Boolean
    suspend fun atualizarPerfil(id: Long, nome: String, idioma: IdiomaUsuario): Boolean
    suspend fun excluir(id: Long): Boolean
}
