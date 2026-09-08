package com.monarca.cotacao.http

import io.ktor.resources.Resource
import kotlinx.serialization.Serializable

@Serializable
@Resource("/cotacoes")
class Cotacoes {
    @Serializable
    @Resource("hoje")
    class Hoje(val parent: Cotacoes = Cotacoes())

    @Serializable
    @Resource("{id}")
    class Id(val parent: Cotacoes = Cotacoes(), val id: Long)
}
