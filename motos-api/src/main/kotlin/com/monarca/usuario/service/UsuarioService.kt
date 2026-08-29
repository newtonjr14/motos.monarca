package com.monarca.usuario.service

import com.monarca.Texto
import com.monarca.auth.domain.Permissao
import com.monarca.auth.domain.UsuarioAutenticado
import com.monarca.common.enums.Status
import com.monarca.localidade.service.AcessoNegado
import com.monarca.localidade.service.RecursoNaoEncontrado
import com.monarca.localidade.service.RequisicaoInvalida
import com.monarca.usuario.Senha
import com.monarca.usuario.SystemUser
import com.monarca.usuario.domain.IdiomaUsuario
import com.monarca.usuario.domain.PerfilUsuario
import com.monarca.usuario.domain.Usuario
import com.monarca.usuario.dto.UsuarioRequest
import com.monarca.usuario.dto.UsuarioResponse
import com.monarca.usuario.repository.UsuarioRepository

class UsuarioService(
    private val repository: UsuarioRepository,
) {

    suspend fun init() = repository.inicializar()

    suspend fun listar(atual: UsuarioAutenticado): List<UsuarioResponse> {
        exigirPermissao(atual, Permissao.USUARIO_LISTAR)
        return repository.listar().map { it.toResponse() }
    }

    suspend fun buscar(id: Long, atual: UsuarioAutenticado): UsuarioResponse {
        exigirPermissao(atual, Permissao.USUARIO_LISTAR)
        return repository.buscar(id)?.toResponse()
            ?: throw RecursoNaoEncontrado("Usuário $id não encontrado")
    }

    suspend fun criar(request: UsuarioRequest, atual: UsuarioAutenticado): UsuarioResponse {
        exigirPermissao(atual, Permissao.USUARIO_CRIAR)
        validarGestaoPerfil(atual, request.perfil, alvo = null)

        val nome = validarNome(request.nome)
        val login = validarLogin(request.login)
        val email = validarEmail(request.email)
        val status = validarStatusVisivel(request.status)
        val senhaHash = Senha.hash(validarSenhaNova(request.senha))

        if (repository.existePorLogin(login)) {
            throw RequisicaoInvalida("Já existe um usuário com o login $login")
        }
        if (repository.existePorEmail(email)) {
            throw RequisicaoInvalida("Já existe um usuário com o e-mail $email")
        }

        val id = repository.inserir(nome, login, email, senhaHash, request.perfil, request.idioma, status)
        return buscar(id, atual)
    }

    suspend fun atualizar(id: Long, request: UsuarioRequest, atual: UsuarioAutenticado): UsuarioResponse {
        exigirPermissao(atual, Permissao.USUARIO_EDITAR)
        val alvo = repository.buscar(id) ?: throw RecursoNaoEncontrado("Usuário $id não encontrado")
        protegerSystem(alvo)
        validarGestaoPerfil(atual, request.perfil, alvo)

        val nome = validarNome(request.nome)
        val login = validarLogin(request.login)
        val email = validarEmail(request.email)
        val status = validarStatusVisivel(request.status)
        val senhaHash = senhaOpcional(request.senha)?.let(Senha::hash) ?: alvo.senhaHash

        if (repository.existePorLogin(login, ignorarId = id)) {
            throw RequisicaoInvalida("Já existe um usuário com o login $login")
        }
        if (repository.existePorEmail(email, ignorarId = id)) {
            throw RequisicaoInvalida("Já existe um usuário com o e-mail $email")
        }

        repository.atualizar(id, nome, login, email, senhaHash, request.perfil, request.idioma, status)
        return buscar(id, atual)
    }

    suspend fun excluir(id: Long, atual: UsuarioAutenticado) {
        exigirPermissao(atual, Permissao.USUARIO_EXCLUIR)
        val alvo = repository.buscar(id) ?: throw RecursoNaoEncontrado("Usuário $id não encontrado")
        protegerSystem(alvo)
        validarGestaoPerfil(atual, alvo.perfil, alvo)

        if (!repository.excluir(id)) {
            throw RecursoNaoEncontrado("Usuário $id não encontrado")
        }
    }

    private fun exigirPermissao(atual: UsuarioAutenticado, permissao: Permissao) {
        if (permissao.codigo !in atual.permissoes) {
            throw AcessoNegado("Permissão insuficiente: ${permissao.codigo}")
        }
    }

    private fun protegerSystem(usuario: Usuario) {
        if (SystemUser.isSystem(usuario.login)) {
            throw AcessoNegado("O usuário SYSTEM não pode ser alterado ou excluído")
        }
    }

    private fun validarGestaoPerfil(atual: UsuarioAutenticado, perfilAlvo: PerfilUsuario, alvo: Usuario?) {
        if (atual.perfil == PerfilUsuario.ADMINISTRADOR) return

        if (atual.perfil == PerfilUsuario.GESTOR) {
            if (perfilAlvo == PerfilUsuario.ADMINISTRADOR || perfilAlvo == PerfilUsuario.GESTOR) {
                throw AcessoNegado("Gestor não pode atribuir perfil Administrador ou Gestor")
            }
            alvo?.let {
                if (it.perfil == PerfilUsuario.ADMINISTRADOR || it.perfil == PerfilUsuario.GESTOR) {
                    throw AcessoNegado("Gestor não pode alterar usuários Administrador ou Gestor")
                }
                protegerSystem(it)
            }
            return
        }

        throw AcessoNegado("Sem permissão para gerenciar usuários")
    }

    private fun validarNome(nome: String): String {
        val trimmed = nome.trim()
        if (trimmed.isEmpty()) {
            throw RequisicaoInvalida("Nome é obrigatório")
        }
        return Texto.titleCase(trimmed)
    }

    private fun validarLogin(login: String): String {
        val normalizado = login.trim().lowercase()
        if (normalizado.length < 3) {
            throw RequisicaoInvalida("Login deve ter pelo menos 3 caracteres")
        }
        if (!normalizado.matches(Regex("^[a-z0-9._-]+$"))) {
            throw RequisicaoInvalida("Login inválido")
        }
        if (normalizado == SystemUser.LOGIN) {
            throw RequisicaoInvalida("Login reservado")
        }
        return normalizado
    }

    private fun validarEmail(email: String): String {
        val normalizado = Texto.email(email) ?: throw RequisicaoInvalida("E-mail é obrigatório")
        if (!normalizado.contains("@") || !normalizado.contains(".")) {
            throw RequisicaoInvalida("E-mail inválido")
        }
        return normalizado
    }

    private fun validarSenhaNova(senha: String?): String {
        val valor = senhaOpcional(senha) ?: throw RequisicaoInvalida("Senha é obrigatória")
        if (valor.length < 8) {
            throw RequisicaoInvalida("Senha deve ter pelo menos 8 caracteres")
        }
        return valor
    }

    private fun senhaOpcional(senha: String?): String? = senha?.trim()?.takeIf { it.isNotEmpty() }?.also {
        if (it.length < 8) {
            throw RequisicaoInvalida("Senha deve ter pelo menos 8 caracteres")
        }
    }

    private fun validarStatusVisivel(status: Status): Status {
        if (status == Status.DELETADO) {
            throw RequisicaoInvalida("Use DELETE para marcar como deletado")
        }
        return status
    }

    private fun Usuario.toResponse() = UsuarioResponse(
        id = id,
        nome = nome,
        login = login,
        email = email,
        perfil = perfil,
        idioma = idioma,
        status = status,
    )
}
