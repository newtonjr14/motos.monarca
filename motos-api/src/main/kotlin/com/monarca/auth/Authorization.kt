package com.monarca.auth

import com.monarca.auth.domain.Permissao
import com.monarca.auth.domain.UsuarioAutenticado
import com.monarca.localidade.service.AcessoNegado
import io.ktor.server.application.ApplicationCall
import io.ktor.server.auth.principal

fun ApplicationCall.usuarioAutenticado(): UsuarioAutenticado =
    principal<UsuarioAutenticado>() ?: throw AcessoNegado("Não autenticado")

fun ApplicationCall.requirePermissao(permissao: Permissao) {
    val usuario = usuarioAutenticado()
    if (permissao.codigo !in usuario.permissoes) {
        throw AcessoNegado("Permissão insuficiente: ${permissao.codigo}")
    }
}

fun ApplicationCall.requireQualquerPermissao(vararg permissoes: Permissao) {
    val usuario = usuarioAutenticado()
    if (permissoes.none { it.codigo in usuario.permissoes }) {
        throw AcessoNegado("Permissão insuficiente")
    }
}

fun ApplicationCall.podeConsultarLocalidade() {
    requireQualquerPermissao(Permissao.LOCALIDADE_CONSULTAR, Permissao.LOCALIDADE_GERENCIAR)
}

fun ApplicationCall.podeGerenciarLocalidade() {
    requirePermissao(Permissao.LOCALIDADE_GERENCIAR)
}

fun ApplicationCall.podeConsultarPessoa() {
    requireQualquerPermissao(Permissao.PESSOA_CONSULTAR, Permissao.PESSOA_GERENCIAR)
}

fun ApplicationCall.podeGerenciarPessoa() {
    requirePermissao(Permissao.PESSOA_GERENCIAR)
}
