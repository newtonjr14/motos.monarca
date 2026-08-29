package com.monarca.usuario.http

import io.ktor.resources.Resource
import kotlinx.serialization.Serializable

@Serializable
@Resource("/usuarios")
class Usuarios {
    @Serializable
    @Resource("{id}")
    class Id(val parent: Usuarios = Usuarios(), val id: Long)
}
