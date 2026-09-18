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
@Resource("/recebimentos")
class Recebimentos

@Serializable
@Resource("/pagamentos")
class Pagamentos
