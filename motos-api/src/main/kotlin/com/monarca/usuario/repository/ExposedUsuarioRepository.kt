package com.monarca.usuario.repository

import com.monarca.audit.service.AuditService
import com.monarca.common.enums.Status
import com.monarca.empresa.repository.FiliaisTable
import com.monarca.usuario.Senha
import com.monarca.usuario.SystemUser
import com.monarca.usuario.domain.FilialAcesso
import com.monarca.usuario.domain.IdiomaUsuario
import com.monarca.usuario.domain.PerfilUsuario
import com.monarca.usuario.domain.Usuario
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.singleOrNull
import kotlinx.coroutines.flow.toList
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.neq
import org.jetbrains.exposed.v1.r2dbc.R2dbcDatabase
import org.jetbrains.exposed.v1.r2dbc.insert
import org.jetbrains.exposed.v1.r2dbc.selectAll
import org.jetbrains.exposed.v1.r2dbc.transactions.suspendTransaction
import org.jetbrains.exposed.v1.r2dbc.update

class ExposedUsuarioRepository(
    private val database: R2dbcDatabase,
    private val audit: AuditService,
) : UsuarioRepository {

    override suspend fun inicializar() {
        seedSystemUser()
        sincronizarSystemComFiliaisAtivas()
    }

    override suspend fun listar(): List<Usuario> = suspendTransaction(database) {
        UsuariosTable.selectAll()
            .where { UsuariosTable.status neq Status.DELETADO.name.lowercase() }
            .orderBy(UsuariosTable.nome to SortOrder.ASC)
            .map { it.toUsuario() }
            .toList()
    }

    override suspend fun listarAtivosDaFilial(idFilial: Long): List<Usuario> = suspendTransaction(database) {
        UsuariosTable
            .innerJoin(UsuarioFiliaisTable)
            .selectAll()
            .where {
                (UsuarioFiliaisTable.idFilial eq idFilial) and
                    (UsuarioFiliaisTable.status eq Status.ATIVO.name.lowercase()) and
                    (UsuariosTable.status eq Status.ATIVO.name.lowercase()) and
                    (UsuariosTable.login neq SystemUser.LOGIN)
            }
            .orderBy(UsuariosTable.nome to SortOrder.ASC)
            .map { it.toUsuario() }
            .toList()
    }

    override suspend fun buscar(id: Long): Usuario? = suspendTransaction(database) {
        UsuariosTable.selectAll()
            .where { (UsuariosTable.id eq id) and (UsuariosTable.status neq Status.DELETADO.name.lowercase()) }
            .map { it.toUsuario() }
            .singleOrNull()
    }

    override suspend fun buscarPorLogin(login: String): Usuario? = suspendTransaction(database) {
        UsuariosTable.selectAll()
            .where {
                (UsuariosTable.login eq login) and (UsuariosTable.status neq Status.DELETADO.name.lowercase())
            }
            .map { it.toUsuario() }
            .singleOrNull()
    }

    override suspend fun existePorEmail(email: String, ignorarId: Long?): Boolean =
        suspendTransaction(database) {
            val idExistente = UsuariosTable.selectAll()
                .where { (UsuariosTable.email eq email) and (UsuariosTable.status neq Status.DELETADO.name.lowercase()) }
                .map { it[UsuariosTable.id].value }
                .singleOrNull()
            idExistente != null && idExistente != ignorarId
        }

    override suspend fun existePorLogin(login: String, ignorarId: Long?): Boolean =
        suspendTransaction(database) {
            val idExistente = UsuariosTable.selectAll()
                .where { (UsuariosTable.login eq login) and (UsuariosTable.status neq Status.DELETADO.name.lowercase()) }
                .map { it[UsuariosTable.id].value }
                .singleOrNull()
            idExistente != null && idExistente != ignorarId
        }

    override suspend fun inserir(
        nome: String,
        login: String,
        email: String,
        senhaHash: String,
        perfil: PerfilUsuario,
        idioma: IdiomaUsuario,
        status: Status,
    ): Long {
        val id = suspendTransaction(database) {
            val inserted = UsuariosTable.insert {
                it[UsuariosTable.nome] = nome
                it[UsuariosTable.login] = login
                it[UsuariosTable.email] = email
                it[UsuariosTable.senhaHash] = senhaHash
                it[UsuariosTable.perfil] = perfil.name.lowercase()
                it[UsuariosTable.idioma] = idioma.name.lowercase()
                it[UsuariosTable.status] = status.name.lowercase()
            }
            inserted[UsuariosTable.id].value
        }
        audit.registrarInsert(
            tableName = "usuario",
            recordId = id.toString(),
            newValues = snapshot(nome, login, email, perfil, idioma, status),
        )
        return id
    }

    override suspend fun atualizar(
        id: Long,
        nome: String,
        login: String,
        email: String,
        senhaHash: String,
        perfil: PerfilUsuario,
        idioma: IdiomaUsuario,
        status: Status,
    ): Boolean {
        val anterior = buscar(id)
        val ok = suspendTransaction(database) {
            UsuariosTable.update({
                (UsuariosTable.id eq id) and (UsuariosTable.status neq Status.DELETADO.name.lowercase())
            }) {
                it[UsuariosTable.nome] = nome
                it[UsuariosTable.login] = login
                it[UsuariosTable.email] = email
                it[UsuariosTable.senhaHash] = senhaHash
                it[UsuariosTable.perfil] = perfil.name.lowercase()
                it[UsuariosTable.idioma] = idioma.name.lowercase()
                it[UsuariosTable.status] = status.name.lowercase()
            } > 0
        }
        if (ok && anterior != null) {
            audit.registrarUpdate(
                tableName = "usuario",
                recordId = id.toString(),
                oldValues = snapshot(anterior),
                newValues = snapshot(nome, login, email, perfil, idioma, status),
            )
        }
        return ok
    }

    override suspend fun atualizarSenha(id: Long, senhaHash: String): Boolean =
        suspendTransaction(database) {
            UsuariosTable.update({
                (UsuariosTable.id eq id) and (UsuariosTable.status neq Status.DELETADO.name.lowercase())
            }) {
                it[UsuariosTable.senhaHash] = senhaHash
            } > 0
        }

    override suspend fun atualizarPerfil(id: Long, nome: String, idioma: IdiomaUsuario): Boolean {
        val anterior = buscar(id)
        val ok = suspendTransaction(database) {
            UsuariosTable.update({
                (UsuariosTable.id eq id) and (UsuariosTable.status neq Status.DELETADO.name.lowercase())
            }) {
                it[UsuariosTable.nome] = nome
                it[UsuariosTable.idioma] = idioma.name.lowercase()
            } > 0
        }
        if (ok && anterior != null) {
            audit.registrarUpdate(
                tableName = "usuario",
                recordId = id.toString(),
                oldValues = """{"nome":"${anterior.nome}","idioma":"${anterior.idioma.name.lowercase()}"}""",
                newValues = """{"nome":"$nome","idioma":"${idioma.name.lowercase()}"}""",
            )
        }
        return ok
    }

    override suspend fun excluir(id: Long): Boolean {
        val anterior = buscar(id)
        val ok = suspendTransaction(database) {
            UsuariosTable.update({
                (UsuariosTable.id eq id) and (UsuariosTable.status neq Status.DELETADO.name.lowercase())
            }) {
                it[status] = Status.DELETADO.name.lowercase()
            } > 0
        }
        if (ok && anterior != null) {
            audit.registrarSoftDelete(
                tableName = "usuario",
                recordId = id.toString(),
                oldValues = snapshot(anterior),
            )
        }
        return ok
    }

    override suspend fun listarFiliais(idUsuario: Long): List<FilialAcesso> = suspendTransaction(database) {
        UsuarioFiliaisTable
            .innerJoin(FiliaisTable)
            .selectAll()
            .where {
                (UsuarioFiliaisTable.idUsuario eq idUsuario) and
                    (UsuarioFiliaisTable.status neq Status.DELETADO.name.lowercase()) and
                    (FiliaisTable.status eq Status.ATIVO.name.lowercase())
            }
            .orderBy(FiliaisTable.principal to SortOrder.DESC, FiliaisTable.nome to SortOrder.ASC)
            .map {
                FilialAcesso(
                    id = it[FiliaisTable.id].value,
                    nome = it[FiliaisTable.nome],
                    principal = it[FiliaisTable.principal],
                    moedaOperacao = it[FiliaisTable.moedaOperacao],
                )
            }
            .toList()
    }

    override suspend fun temAcessoFilial(idUsuario: Long, idFilial: Long): Boolean =
        suspendTransaction(database) {
            UsuarioFiliaisTable
                .innerJoin(FiliaisTable)
                .selectAll()
                .where {
                    (UsuarioFiliaisTable.idUsuario eq idUsuario) and
                        (UsuarioFiliaisTable.idFilial eq idFilial) and
                        (UsuarioFiliaisTable.status neq Status.DELETADO.name.lowercase()) and
                        (FiliaisTable.status eq Status.ATIVO.name.lowercase())
                }
                .toList()
                .isNotEmpty()
        }

    override suspend fun substituirFiliais(idUsuario: Long, idsFiliais: List<Long>) {
        suspendTransaction(database) {
            val atuais = UsuarioFiliaisTable.selectAll()
                .where { UsuarioFiliaisTable.idUsuario eq idUsuario }
                .toList()
            val porFilial = atuais.associateBy { it[UsuarioFiliaisTable.idFilial].value }

            for (row in atuais) {
                val idFilial = row[UsuarioFiliaisTable.idFilial].value
                if (idFilial !in idsFiliais && row[UsuarioFiliaisTable.status] != Status.DELETADO.name.lowercase()) {
                    UsuarioFiliaisTable.update({ UsuarioFiliaisTable.id eq row[UsuarioFiliaisTable.id].value }) {
                        it[status] = Status.DELETADO.name.lowercase()
                    }
                }
            }

            for (idFilial in idsFiliais) {
                val existente = porFilial[idFilial]
                if (existente == null) {
                    UsuarioFiliaisTable.insert {
                        it[UsuarioFiliaisTable.idUsuario] = idUsuario
                        it[UsuarioFiliaisTable.idFilial] = idFilial
                        it[status] = Status.ATIVO.name.lowercase()
                    }
                } else if (existente[UsuarioFiliaisTable.status] != Status.ATIVO.name.lowercase()) {
                    UsuarioFiliaisTable.update({ UsuarioFiliaisTable.id eq existente[UsuarioFiliaisTable.id].value }) {
                        it[status] = Status.ATIVO.name.lowercase()
                    }
                }
            }
        }
    }

    override suspend fun vincularFilial(idUsuario: Long, idFilial: Long) {
        suspendTransaction(database) {
            val existente = UsuarioFiliaisTable.selectAll()
                .where {
                    (UsuarioFiliaisTable.idUsuario eq idUsuario) and (UsuarioFiliaisTable.idFilial eq idFilial)
                }
                .toList()
                .singleOrNull()
            if (existente == null) {
                UsuarioFiliaisTable.insert {
                    it[UsuarioFiliaisTable.idUsuario] = idUsuario
                    it[UsuarioFiliaisTable.idFilial] = idFilial
                    it[status] = Status.ATIVO.name.lowercase()
                }
            } else if (existente[UsuarioFiliaisTable.status] != Status.ATIVO.name.lowercase()) {
                UsuarioFiliaisTable.update({ UsuarioFiliaisTable.id eq existente[UsuarioFiliaisTable.id].value }) {
                    it[status] = Status.ATIVO.name.lowercase()
                }
            }
        }
    }

    override suspend fun desativarVinculosDaFilial(idFilial: Long) {
        suspendTransaction(database) {
            UsuarioFiliaisTable.update({
                (UsuarioFiliaisTable.idFilial eq idFilial) and
                    (UsuarioFiliaisTable.status neq Status.DELETADO.name.lowercase())
            }) {
                it[status] = Status.DELETADO.name.lowercase()
            }
        }
    }

    override suspend fun sincronizarSystemComFiliaisAtivas() {
        val system = buscarPorLogin(SystemUser.LOGIN) ?: return
        val ids = suspendTransaction(database) {
            FiliaisTable.selectAll()
                .where { FiliaisTable.status eq Status.ATIVO.name.lowercase() }
                .map { it[FiliaisTable.id].value }
                .toList()
        }
        if (ids.isEmpty()) return
        val atuais = listarFiliais(system.id).map { it.id }.toSet()
        for (idFilial in ids) {
            if (idFilial !in atuais) {
                vincularFilial(system.id, idFilial)
            }
        }
    }

    private suspend fun seedSystemUser() {
        val login = SystemUser.LOGIN
        val existente = buscarPorLogin(login)
        if (existente != null) {
            if (existente.status != Status.ATIVO || existente.perfil != PerfilUsuario.ADMINISTRADOR) {
                atualizar(
                    id = existente.id,
                    nome = SystemUser.NOME,
                    login = login,
                    email = SystemUser.EMAIL,
                    senhaHash = Senha.hash(SystemUser.SENHA),
                    perfil = PerfilUsuario.ADMINISTRADOR,
                    idioma = IdiomaUsuario.PT,
                    status = Status.ATIVO,
                )
            }
            return
        }

        inserir(
            nome = SystemUser.NOME,
            login = login,
            email = SystemUser.EMAIL,
            senhaHash = Senha.hash(SystemUser.SENHA),
            perfil = PerfilUsuario.ADMINISTRADOR,
            idioma = IdiomaUsuario.PT,
            status = Status.ATIVO,
        )
    }

    private fun ResultRow.toUsuario() = Usuario(
        id = this[UsuariosTable.id].value,
        nome = this[UsuariosTable.nome],
        login = this[UsuariosTable.login],
        email = this[UsuariosTable.email],
        senhaHash = this[UsuariosTable.senhaHash],
        perfil = PerfilUsuario.valueOf(this[UsuariosTable.perfil].uppercase()),
        idioma = IdiomaUsuario.valueOf(this[UsuariosTable.idioma].uppercase()),
        status = Status.valueOf(this[UsuariosTable.status].uppercase()),
    )

    private fun snapshot(usuario: Usuario): String =
        snapshot(usuario.nome, usuario.login, usuario.email, usuario.perfil, usuario.idioma, usuario.status)

    private fun snapshot(
        nome: String,
        login: String,
        email: String,
        perfil: PerfilUsuario,
        idioma: IdiomaUsuario,
        status: Status,
    ): String = """{"nome":"$nome","login":"$login","email":"$email","perfil":"${perfil.name.lowercase()}","idioma":"${idioma.name.lowercase()}","status":"${status.name.lowercase()}"}"""
}
