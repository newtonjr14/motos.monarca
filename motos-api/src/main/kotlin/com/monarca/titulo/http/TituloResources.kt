package com.monarca.titulo.http

import io.ktor.resources.Resource
import kotlinx.serialization.Serializable

@Serializable
@Resource("/titulos-receber")
class TitulosReceber {
    @Serializable
    @Resource("{id}")
    class Id(val parent: TitulosReceber = TitulosReceber(), val id: Long)
}

@Serializable
@Resource("/titulos-pagar")
class TitulosPagar {
    @Serializable
    @Resource("{id}")
    class Id(val parent: TitulosPagar = TitulosPagar(), val id: Long)
}

@Serializable
@Resource("/baixas-receber")
class BaixasReceber(
    val idFilial: Long? = null,
)

@Serializable
@Resource("/baixas-pagar")
class BaixasPagar(
    val idFilial: Long? = null,
)

@Serializable
@Resource("/recebimentos")
class Recebimentos

@Serializable
@Resource("/pagamentos")
class Pagamentos
