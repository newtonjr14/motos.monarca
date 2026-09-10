package com.monarca.produto.http

import com.monarca.produto.domain.TipoProduto
import io.ktor.resources.Resource
import kotlinx.serialization.Serializable

@Serializable
@Resource("/produtos")
class Produtos(
    val idFilial: Long? = null,
    val tipo: TipoProduto? = null,
) {
    @Serializable
    @Resource("{id}")
    class Id(val parent: Produtos = Produtos(), val id: Long, val idFilial: Long? = null) {
        @Serializable
        @Resource("status")
        class StatusPatch(val parent: Id)
    }
}
