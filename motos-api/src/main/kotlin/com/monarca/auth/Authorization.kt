package com.monarca.auth

import com.monarca.auth.domain.Permissao
import com.monarca.auth.domain.UsuarioAutenticado
import com.monarca.localidade.service.acesso
import io.ktor.server.application.ApplicationCall
import io.ktor.server.auth.principal

fun ApplicationCall.usuarioAutenticado(): UsuarioAutenticado =
    principal<UsuarioAutenticado>() ?: throw acesso("NAO_AUTENTICADO", "Não autenticado")

fun ApplicationCall.requirePermissao(permissao: Permissao) {
    val usuario = usuarioAutenticado()
    if (permissao.codigo !in usuario.permissoes) {
        throw acesso("PERMISSAO_INSUFICIENTE", "Permissão insuficiente: ${permissao.codigo}", "permissao" to permissao.codigo)
    }
}

fun ApplicationCall.requireQualquerPermissao(vararg permissoes: Permissao) {
    val usuario = usuarioAutenticado()
    if (permissoes.none { it.codigo in usuario.permissoes }) {
        throw acesso("PERMISSAO_INSUFICIENTE", "Permissão insuficiente")
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

fun ApplicationCall.podeGerenciarDocumento() {
    requirePermissao(Permissao.DOCUMENTO_GERENCIAR)
}

fun ApplicationCall.podeConsultarEmpresa() {
    requireQualquerPermissao(
        Permissao.CONFIGURACAO,
        Permissao.USUARIO_LISTAR,
    )
}

fun ApplicationCall.podeGerenciarEmpresa() {
    requirePermissao(Permissao.CONFIGURACAO)
}

fun ApplicationCall.podeConsultarProduto() {
    requireQualquerPermissao(Permissao.PRODUTO_CONSULTAR, Permissao.PRODUTO_GERENCIAR)
}

fun ApplicationCall.podeGerenciarProduto() {
    requirePermissao(Permissao.PRODUTO_GERENCIAR)
}

fun ApplicationCall.podeConsultarEstoque() {
    requireQualquerPermissao(Permissao.ESTOQUE_CONSULTAR, Permissao.ESTOQUE_GERENCIAR)
}

fun ApplicationCall.podeGerenciarEstoque() {
    requirePermissao(Permissao.ESTOQUE_GERENCIAR)
}

fun ApplicationCall.podeConsultarCotacao() {
    requireQualquerPermissao(Permissao.COTACAO_CONSULTAR, Permissao.COTACAO_GERENCIAR)
}

fun ApplicationCall.podeGerenciarCotacao() {
    requirePermissao(Permissao.COTACAO_GERENCIAR)
}

fun ApplicationCall.podeConsultarCaixa() {
    requireQualquerPermissao(Permissao.CAIXA_GERENCIAR, Permissao.CAIXA_OPERAR)
}

fun ApplicationCall.podeGerenciarCaixa() {
    requirePermissao(Permissao.CAIXA_GERENCIAR)
}

fun ApplicationCall.podeOperarCaixa() {
    requireQualquerPermissao(Permissao.CAIXA_OPERAR, Permissao.CAIXA_GERENCIAR)
}

fun ApplicationCall.podeRegistrarVenda() {
    requirePermissao(Permissao.VENDA_REGISTRAR)
}
