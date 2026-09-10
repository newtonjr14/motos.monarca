package com.monarca.auth.service

import com.monarca.Texto
import com.monarca.auth.JwtService
import com.monarca.auth.domain.Rbac
import com.monarca.auth.dto.AlterarSenhaRequest
import com.monarca.auth.dto.EditarPerfilRequest
import com.monarca.auth.dto.LoginRequest
import com.monarca.auth.dto.PerfilAutenticadoResponse
import com.monarca.auth.dto.TokenResponse
import com.monarca.auth.repository.RefreshTokenRepository
import com.monarca.common.enums.Status
import com.monarca.localidade.service.RecursoNaoEncontrado
import com.monarca.localidade.service.invalido
import com.monarca.usuario.dto.FilialAcessoResponse
import com.monarca.usuario.Senha
import com.monarca.usuario.domain.Usuario
import com.monarca.usuario.repository.UsuarioRepository
import java.security.MessageDigest
import java.security.SecureRandom
import java.util.Base64

class AuthService(
    private val usuarioRepository: UsuarioRepository,
    private val refreshTokenRepository: RefreshTokenRepository,
    private val jwtService: JwtService,
) {
    private val random = SecureRandom()

    suspend fun login(request: LoginRequest): TokenResponse {
        val login = validarLogin(request.login)
        val senha = request.senha.trim()
        if (senha.isEmpty()) throw invalido("SENHA_OBRIGATORIA", "Senha é obrigatória")

        val usuario = usuarioRepository.buscarPorLogin(login)
            ?: throw invalido("LOGIN_SENHA_INVALIDOS", "Login ou senha inválidos")

        if (usuario.status != Status.ATIVO) {
            throw invalido("USUARIO_INATIVO", "Usuário inativo")
        }
        if (!Senha.conferir(senha, usuario.senhaHash)) {
            throw invalido("LOGIN_SENHA_INVALIDOS", "Login ou senha inválidos")
        }

        return emitirTokens(usuario)
    }

    suspend fun refresh(refreshToken: String): TokenResponse {
        val token = refreshToken.trim()
        if (token.isEmpty()) throw invalido("REFRESH_OBRIGATORIO", "Refresh token é obrigatório")

        val hash = hashToken(token)
        val registro = refreshTokenRepository.buscarPorHash(hash)
            ?: throw invalido("REFRESH_INVALIDO", "Refresh token inválido")

        if (registro.expiresAt < System.currentTimeMillis()) {
            refreshTokenRepository.revogar(hash)
            throw invalido("REFRESH_EXPIRADO", "Refresh token expirado")
        }

        val usuario = usuarioRepository.buscar(registro.idUsuario)
            ?: throw invalido("REFRESH_INVALIDO", "Refresh token inválido")

        if (usuario.status != Status.ATIVO) {
            refreshTokenRepository.revogar(hash)
            throw invalido("USUARIO_INATIVO", "Usuário inativo")
        }

        refreshTokenRepository.revogar(hash)
        return emitirTokens(usuario)
    }

    suspend fun perfil(id: Long): PerfilAutenticadoResponse {
        val usuario = usuarioRepository.buscar(id)
            ?: throw RecursoNaoEncontrado("Usuário $id não encontrado")
        return usuario.toPerfil()
    }

    suspend fun alterarSenha(id: Long, request: AlterarSenhaRequest) {
        val usuario = usuarioRepository.buscar(id)
            ?: throw RecursoNaoEncontrado("Usuário $id não encontrado")

        if (!Senha.conferir(request.senhaAtual.trim(), usuario.senhaHash)) {
            throw invalido("SENHA_ATUAL_INCORRETA", "Senha atual incorreta")
        }
        val nova = validarSenhaNova(request.senhaNova)
        usuarioRepository.atualizarSenha(id, Senha.hash(nova))
        refreshTokenRepository.revogarTodos(id)
    }

    suspend fun editarPerfil(id: Long, request: EditarPerfilRequest) {
        val usuario = usuarioRepository.buscar(id)
            ?: throw RecursoNaoEncontrado("Usuário $id não encontrado")

        val nome = validarNome(request.nome)
        usuarioRepository.atualizarPerfil(id, nome, request.idioma)
    }

    suspend fun logout(refreshToken: String?) {
        if (refreshToken.isNullOrBlank()) return
        refreshTokenRepository.revogar(hashToken(refreshToken.trim()))
    }

    private suspend fun emitirTokens(usuario: Usuario): TokenResponse {
        val accessToken = jwtService.gerarAccessToken(usuario)
        val refreshToken = gerarRefreshToken()
        val agora = System.currentTimeMillis()
        refreshTokenRepository.salvar(
            idUsuario = usuario.id,
            tokenHash = hashToken(refreshToken),
            expiresAt = agora + jwtService.refreshExpirationMillis(),
            createdAt = agora,
        )
        return TokenResponse(
            accessToken = accessToken,
            refreshToken = refreshToken,
            expiresIn = jwtService.accessExpirationSeconds(),
        )
    }

    private fun gerarRefreshToken(): String {
        val bytes = ByteArray(32).also { random.nextBytes(it) }
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes)
    }

    private fun hashToken(token: String): String {
        val digest = MessageDigest.getInstance("SHA-256").digest(token.toByteArray())
        return Base64.getEncoder().encodeToString(digest)
    }

    private fun validarLogin(login: String): String {
        val normalizado = login.trim().lowercase()
        if (normalizado.length < 3) {
            throw invalido("LOGIN_INVALIDO", "Login inválido")
        }
        if (!normalizado.matches(Regex("^[a-z0-9._-]+$"))) {
            throw invalido("LOGIN_INVALIDO", "Login inválido")
        }
        return normalizado
    }

    private fun validarNome(nome: String): String {
        val trimmed = nome.trim()
        if (trimmed.isEmpty()) throw invalido("NOME_OBRIGATORIO", "Nome é obrigatório")
        return Texto.titleCase(trimmed)
    }

    private fun validarSenhaNova(senha: String): String {
        val valor = senha.trim()
        if (valor.length < 8) {
            throw invalido("SENHA_MINIMA", "Senha deve ter pelo menos 8 caracteres")
        }
        return valor
    }

    private suspend fun Usuario.toPerfil() = PerfilAutenticadoResponse(
        id = id,
        nome = nome,
        login = login,
        email = email,
        perfil = perfil,
        idioma = idioma,
        permissoes = Rbac.codigos(perfil).toList().sorted(),
        filiais = usuarioRepository.listarFiliais(id).map {
            FilialAcessoResponse(
                id = it.id,
                nome = it.nome,
                principal = it.principal,
                moedaOperacao = it.moedaOperacao,
                idEstoquePadrao = it.idEstoquePadrao,
            )
        },
    )
}
