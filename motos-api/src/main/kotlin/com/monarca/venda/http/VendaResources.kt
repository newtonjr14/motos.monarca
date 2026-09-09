package com.monarca.venda.http

import io.ktor.resources.Resource
import kotlinx.serialization.Serializable

@Serializable
@Resource("/vendas")
class Vendas(
    val idFilial: Long? = null,
) {
    @Serializable
    @Resource("vendedores")
    class Vendedores(val parent: Vendas = Vendas(), val idFilial: Long? = null)

    @Serializable
    @Resource("{id}")
    class Id(val parent: Vendas = Vendas(), val id: Long)
}
