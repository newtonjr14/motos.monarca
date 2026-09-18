package com.monarca.factura.http

import io.ktor.resources.Resource
import kotlinx.serialization.Serializable

@Serializable
@Resource("/facturas")
class Facturas {
    @Serializable
    @Resource("vendas-elegiveis")
    class VendasElegiveis(val parent: Facturas = Facturas())

    @Serializable
    @Resource("por-venda")
    class PorVenda(val parent: Facturas = Facturas())

    @Serializable
    @Resource("{id}")
    class Id(val parent: Facturas = Facturas(), val id: Long) {
        @Serializable
        @Resource("enviar")
        class Enviar(val parent: Id)

        @Serializable
        @Resource("consultar")
        class Consultar(val parent: Id)
    }
}
