package com.monarca.empresa.http

import io.ktor.resources.Resource
import kotlinx.serialization.Serializable

@Serializable
@Resource("/empresas")
class Empresas {
    @Serializable
    @Resource("{id}")
    class Id(val parent: Empresas = Empresas(), val id: Long)
}

@Serializable
@Resource("/filiais")
class Filiais(
    val idEmpresa: Long? = null,
) {
    @Serializable
    @Resource("principal")
    class Principal(val parent: Filiais = Filiais())

    @Serializable
    @Resource("{id}")
    class Id(val parent: Filiais = Filiais(), val id: Long)
}
