package com.monarca.auth.domain

enum class Permissao(val codigo: String) {
    USUARIO_LISTAR("usuario:listar"),
    USUARIO_CRIAR("usuario:criar"),
    USUARIO_EDITAR("usuario:editar"),
    USUARIO_EXCLUIR("usuario:excluir"),
    LOCALIDADE_GERENCIAR("localidade:gerenciar"),
    LOCALIDADE_CONSULTAR("localidade:consultar"),
    DOCUMENTO_GERENCIAR("documento:gerenciar"),
    PESSOA_GERENCIAR("pessoa:gerenciar"),
    PESSOA_CONSULTAR("pessoa:consultar"),
    FINANCEIRO_OPERAR("financeiro:operar"),
    FINANCEIRO_ESTORNO("financeiro:estorno"),
    VENDA_REGISTRAR("venda:registrar"),
    RELATORIO_FINANCEIRO("relatorio:financeiro"),
    DASHBOARD_CONSULTAR("dashboard:consultar"),
    CONFIGURACAO("configuracao:gerenciar"),
    PRODUTO_CONSULTAR("produto:consultar"),
    PRODUTO_GERENCIAR("produto:gerenciar"),
    ESTOQUE_CONSULTAR("estoque:consultar"),
    ESTOQUE_GERENCIAR("estoque:gerenciar"),
}

object Rbac {
    private val mapa: Map<com.monarca.usuario.domain.PerfilUsuario, Set<Permissao>> = mapOf(
        com.monarca.usuario.domain.PerfilUsuario.ADMINISTRADOR to Permissao.entries.toSet(),
        com.monarca.usuario.domain.PerfilUsuario.GESTOR to Permissao.entries.filter { it != Permissao.CONFIGURACAO }.toSet(),
        com.monarca.usuario.domain.PerfilUsuario.OPERADOR to setOf(
            Permissao.LOCALIDADE_CONSULTAR,
            Permissao.PESSOA_GERENCIAR,
            Permissao.PESSOA_CONSULTAR,
            Permissao.VENDA_REGISTRAR,
            Permissao.PRODUTO_CONSULTAR,
            Permissao.PRODUTO_GERENCIAR,
            Permissao.ESTOQUE_CONSULTAR,
            Permissao.ESTOQUE_GERENCIAR,
        ),
        com.monarca.usuario.domain.PerfilUsuario.VENDEDOR to setOf(
            Permissao.LOCALIDADE_CONSULTAR,
            Permissao.PESSOA_CONSULTAR,
            Permissao.VENDA_REGISTRAR,
            Permissao.PRODUTO_CONSULTAR,
            Permissao.ESTOQUE_CONSULTAR,
        ),
    )

    fun permissoes(perfil: com.monarca.usuario.domain.PerfilUsuario): Set<Permissao> =
        mapa[perfil].orEmpty()

    fun codigos(perfil: com.monarca.usuario.domain.PerfilUsuario): Set<String> =
        permissoes(perfil).map { it.codigo }.toSet()

    fun possui(perfil: com.monarca.usuario.domain.PerfilUsuario, permissao: Permissao): Boolean =
        permissao in permissoes(perfil)
}
