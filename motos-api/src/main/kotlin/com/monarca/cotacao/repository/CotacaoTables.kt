package com.monarca.cotacao.repository

import org.jetbrains.exposed.v1.core.dao.id.LongIdTable

object CotacoesTable : LongIdTable("cotacao") {
    val data = varchar("data", 10)
    val usdPyg = double("usd_pyg")
    val brlPyg = double("brl_pyg")
    val status = varchar("status", 20).default("ativo")
}
