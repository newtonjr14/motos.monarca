package com.monarca.entrada.http

import io.ktor.resources.Resource
import kotlinx.serialization.Serializable

@Serializable
@Resource("/entradas")
class Entradas {
    @Serializable
    @Resource("{id}")
    class Id(val parent: Entradas = Entradas(), val id: Long)
}
