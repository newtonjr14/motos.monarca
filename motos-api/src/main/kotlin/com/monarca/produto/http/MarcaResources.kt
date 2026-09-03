package com.monarca.produto.http

import io.ktor.resources.Resource
import kotlinx.serialization.Serializable
import com.monarca.produto.domain.TipoProduto

@Serializable
@Resource("/marcas")
class Marcas {
    @Serializable
    @Resource("{id}")
    class Id(val parent: Marcas = Marcas(), val id: Long)
}

@Serializable
@Resource("/modelos")
class Modelos(
    val idMarca: Long? = null,
    val tipo: TipoProduto? = null,
) {
    @Serializable
    @Resource("{id}")
    class Id(val parent: Modelos = Modelos(), val id: Long)
}
