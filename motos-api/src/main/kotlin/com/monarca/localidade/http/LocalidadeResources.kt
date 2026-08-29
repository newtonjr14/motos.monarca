package com.monarca.localidade.http

import io.ktor.resources.Resource
import kotlinx.serialization.Serializable

@Serializable
@Resource("/paises")
class Paises {
    @Serializable
    @Resource("{id}")
    class Id(val parent: Paises = Paises(), val id: Long) {
        @Serializable
        @Resource("divisoes")
        class Divisoes(val parent: Id)
    }
}

@Serializable
@Resource("/divisoes")
class Divisoes(
    val idPais: Long? = null,
) {
    @Serializable
    @Resource("{id}")
    class Id(val parent: Divisoes = Divisoes(), val id: Long)
}

@Serializable
@Resource("/cidades")
class Cidades(
    val idPais: Long? = null,
    val idDivisao: Long? = null,
) {
    @Serializable
    @Resource("{id}")
    class Id(val parent: Cidades = Cidades(), val id: Long)
}
