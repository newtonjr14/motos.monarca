package com.monarca.estoque.http

import io.ktor.resources.Resource
import kotlinx.serialization.Serializable

@Serializable
@Resource("/estoques")
class Estoques(
    val idFilial: Long? = null,
) {
    @Serializable
    @Resource("{id}")
    class Id(val parent: Estoques = Estoques(), val id: Long)
}

@Serializable
@Resource("/estoque-produtos")
class EstoqueProdutos(
    val idEstoque: Long? = null,
    val idFilial: Long? = null,
) {
    @Serializable
    @Resource("{id}")
    class Id(val parent: EstoqueProdutos = EstoqueProdutos(), val id: Long)
}
