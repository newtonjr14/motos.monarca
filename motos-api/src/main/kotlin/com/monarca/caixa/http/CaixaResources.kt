package com.monarca.caixa.http

import io.ktor.resources.Resource
import kotlinx.serialization.Serializable

@Serializable
@Resource("/finalizadores")
class Finalizadores {
    @Serializable
    @Resource("{id}")
    class Id(val parent: Finalizadores = Finalizadores(), val id: Long)
}

@Serializable
@Resource("/caixas")
class Caixas(
    val idFilial: Long? = null,
    val somenteComAcesso: Boolean = false,
) {
    @Serializable
    @Resource("{id}")
    class Id(val parent: Caixas = Caixas(), val id: Long) {
        @Serializable
        @Resource("sessoes")
        class Sessoes(val parent: Id)
    }
}

@Serializable
@Resource("/meus-caixas")
class MeusCaixas(
    val idFilial: Long? = null,
)

@Serializable
@Resource("/caixa-sessoes")
class CaixaSessoes {
    @Serializable
    @Resource("{id}")
    class Id(val parent: CaixaSessoes = CaixaSessoes(), val id: Long) {
        @Serializable
        @Resource("fechar")
        class Fechar(val parent: Id)

        @Serializable
        @Resource("transferencias")
        class Transferencias(val parent: Id)

        @Serializable
        @Resource("movimentacoes")
        class Movimentacoes(val parent: Id)
    }
}
