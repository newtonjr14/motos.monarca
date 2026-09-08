package com.monarca.seed.repository

import org.jetbrains.exposed.v1.core.Table

object SeedDemoMarcadoresTable : Table("seed_demo_marcador") {
    val entidade = varchar("entidade", 40)
    val idEntidade = long("id_entidade")
    override val primaryKey = PrimaryKey(entidade, idEntidade)
}
