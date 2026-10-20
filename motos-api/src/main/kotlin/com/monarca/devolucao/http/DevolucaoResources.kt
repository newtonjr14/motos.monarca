package com.monarca.devolucao.http

import io.ktor.resources.Resource
import kotlinx.serialization.Serializable

@Serializable
@Resource("/devolucoes")
class Devolucoes {
    @Serializable
    @Resource("credito")
    class Credito(val parent: Devolucoes = Devolucoes())

    @Serializable
    @Resource("venda/{idVenda}")
    class Venda(val parent: Devolucoes = Devolucoes(), val idVenda: Long)

    @Serializable
    @Resource("{id}")
    class Id(val parent: Devolucoes = Devolucoes(), val id: Long)
}
