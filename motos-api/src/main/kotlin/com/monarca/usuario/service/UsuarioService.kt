package com.monarca.usuario.service

import com.monarca.Texto
import com.monarca.auth.domain.Permissao
import com.monarca.auth.domain.UsuarioAutenticado
import com.monarca.common.enums.Status
import com.monarca.empresa.repository.EmpresaRepository
import com.monarca.localidade.service.RecursoNaoEncontrado
import com.monarca.localidade.service.acesso
import com.monarca.localidade.service.invalido
import com.monarca.usuario.Senha
import com.monarca.usuario.SystemUser
import com.monarca.usuario.domain.FilialAcesso
import com.monarca.usuario.domain.IdiomaUsuario
import com.monarca.usuario.domain.PerfilUsuario
import com.monarca.usuario.domain.Usuario
import com.monarca.usuario.dto.FilialAcessoResponse
import com.monarca.usuario.dto.UsuarioRequest
import com.monarca.usuario.dto.UsuarioResponse
import com.monarca.usuario.repository.UsuarioRepository

class UsuarioService(
    private val repository: UsuarioRepository,
    private val empresaRepository: EmpresaRepository,
    private val caixaService: com.monarca.caixa.service.CaixaService,
) {

    suspend fun init() {
        repository.inicializar()
        for (usuario in repository.listar()) {
            if (caixaService.listarMeusCaixas(usuario.id, null).isEmpty()) {
                caixaService.substituirAcessosUsuario(usuario.id, null, null)
            }
        }
    }

    suspend fun listar(atual: UsuarioAutenticado): List<UsuarioResponse> {
        exigirPermissao(atual, Permissao.USUARIO_LISTAR)
        val usuarios = repository.listar()
        return buildList {
            for (usuario in usuarios) {
                add(usuario.toResponse())
            }
        }
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
            throw invalido("USUARIO_LOGIN_DUPLICADO", "Já existe um usuário com o login $login", "login" to login)
        }
        if (repository.existePorEmail(email)) {
            throw invalido("USUARIO_EMAIL_DUPLICADO", "Já existe um usuário com o e-mail $email", "email" to email)
        }

        val id = repository.inserir(nome, login, email, senhaHash, request.perfil, request.idioma, status)
        repository.substituirFiliais(id, resolverIdsFiliais(request.idsFiliais, obrigatorio = false))
        caixaService.substituirAcessosUsuario(id, request.idsCaixas, request.idCaixaPadrao)
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
            throw invalido("USUARIO_LOGIN_DUPLICADO", "Já existe um usuário com o login $login", "login" to login)
        }
        if (repository.existePorEmail(email, ignorarId = id)) {
            throw invalido("USUARIO_EMAIL_DUPLICADO", "Já existe um usuário com o e-mail $email", "email" to email)
        }

        repository.atualizar(id, nome, login, email, senhaHash, request.perfil, request.idioma, status)
        request.idsFiliais?.let { ids ->
            if (ids.isEmpty()) {
                throw invalido("FILIAIS_OBRIGATORIAS", "Selecione ao menos uma filial")
            }
            repository.substituirFiliais(id, resolverIdsFiliais(ids, obrigatorio = true))
        }
        if (request.idsCaixas != null || request.idCaixaPadrao != null) {
            caixaService.substituirAcessosUsuario(id, request.idsCaixas, request.idCaixaPadrao)
        }
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
            throw acesso("PERMISSAO_INSUFICIENTE", "Permissão insuficiente: ${permissao.codigo}", "permissao" to permissao.codigo)
        }
    }

    private fun protegerSystem(usuario: Usuario) {
        if (SystemUser.isSystem(usuario.login)) {
            throw acesso("SYSTEM_PROTEGIDO", "O usuário SYSTEM não pode ser alterado ou excluído")
        }
    }

    private fun validarGestaoPerfil(atual: UsuarioAutenticado, perfilAlvo: PerfilUsuario, alvo: Usuario?) {
        if (atual.perfil == PerfilUsuario.ADMINISTRADOR) return

        if (atual.perfil == PerfilUsuario.GESTOR) {
            if (perfilAlvo == PerfilUsuario.ADMINISTRADOR || perfilAlvo == PerfilUsuario.GESTOR) {
                throw acesso("GESTOR_PERFIL", "Gestor não pode atribuir perfil Administrador ou Gestor")
            }
            alvo?.let {
                if (it.perfil == PerfilUsuario.ADMINISTRADOR || it.perfil == PerfilUsuario.GESTOR) {
                    throw acesso("GESTOR_ALTERAR_SUPERIOR", "Gestor não pode alterar usuários Administrador ou Gestor")
                }
                protegerSystem(it)
            }
            return
        }

        throw acesso("SEM_PERMISSAO_USUARIOS", "Sem permissão para gerenciar usuários")
    }

    private fun validarNome(nome: String): String {
        val trimmed = nome.trim()
        if (trimmed.isEmpty()) {
            throw invalido("NOME_OBRIGATORIO", "Nome é obrigatório")
        }
        return Texto.titleCase(trimmed)
    }

    private fun validarLogin(login: String): String {
        val normalizado = login.trim().lowercase()
        if (normalizado.length < 3) {
            throw invalido("LOGIN_MINIMO", "Login deve ter pelo menos 3 caracteres")
        }
        if (!normalizado.matches(Regex("^[a-z0-9._-]+$"))) {
            throw invalido("LOGIN_INVALIDO", "Login inválido")
        }
        if (normalizado == SystemUser.LOGIN) {
            throw invalido("LOGIN_RESERVADO", "Login reservado")
        }
        return normalizado
    }

    private fun validarEmail(email: String): String {
        val normalizado = Texto.email(email) ?: throw invalido("EMAIL_OBRIGATORIO", "E-mail é obrigatório")
        if (!normalizado.contains("@") || !normalizado.contains(".")) {
            throw invalido("EMAIL_INVALIDO", "E-mail inválido")
        }
        return normalizado
    }

    private fun validarSenhaNova(senha: String?): String {
        val valor = senhaOpcional(senha) ?: throw invalido("SENHA_OBRIGATORIA", "Senha é obrigatória")
        if (valor.length < 8) {
            throw invalido("SENHA_MINIMA", "Senha deve ter pelo menos 8 caracteres")
        }
        return valor
    }

    private fun senhaOpcional(senha: String?): String? = senha?.trim()?.takeIf { it.isNotEmpty() }?.also {
        if (it.length < 8) {
            throw invalido("SENHA_MINIMA", "Senha deve ter pelo menos 8 caracteres")
        }
    }

    private fun validarStatusVisivel(status: Status): Status {
        if (status == Status.DELETADO) {
            throw invalido("USE_DELETE", "Use DELETE para marcar como deletado")
        }
        return status
    }

    private suspend fun resolverIdsFiliais(ids: List<Long>?, obrigatorio: Boolean): List<Long> {
        val escolhidos = ids?.distinct().orEmpty()
        if (escolhidos.isEmpty()) {
            if (obrigatorio) {
                throw invalido("FILIAIS_OBRIGATORIAS", "Selecione ao menos uma filial")
            }
            val principal = empresaRepository.buscarFilialPrincipal()
                ?: throw invalido("FILIAL_PRINCIPAL_AUSENTE", "Filial principal não configurada")
            return listOf(principal.filial.id)
        }
        for (idFilial in escolhidos) {
            val detalhe = empresaRepository.buscarFilial(idFilial)
                ?: throw invalido("FILIAL_NAO_ENCONTRADA", "Filial $idFilial não encontrada", "id" to idFilial)
            if (detalhe.filial.status != Status.ATIVO) {
                throw invalido("FILIAL_INATIVA", "Filial $idFilial não está ativa", "id" to idFilial)
            }
        }
        return escolhidos
    }

    private suspend fun Usuario.toResponse() = UsuarioResponse(
        id = id,
        nome = nome,
        login = login,
        email = email,
        perfil = perfil,
        idioma = idioma,
        status = status,
        filiais = repository.listarFiliais(id).map { it.toResponse() },
        caixas = caixaService.listarMeusCaixas(id, null),
    )
}

private fun FilialAcesso.toResponse() = FilialAcessoResponse(
    id = id,
    nome = nome,
    principal = principal,
    moedaOperacao = moedaOperacao,
    idEstoquePadrao = idEstoquePadrao,
)
