package com.monarca.localidade.repository

import org.jetbrains.exposed.v1.core.dao.id.LongIdTable

object PaisesTable : LongIdTable("pais") {
    val nome = varchar("nome", 100)
    val sigla = varchar("sigla", 2).uniqueIndex()
    val usaSiglaDivisao = bool("usa_sigla_divisao").default(true)
    val status = varchar("status", 20).default("ativo")
}

object DivisoesTable : LongIdTable("divisao") {
    val idPais = reference("id_pais", PaisesTable)
    val nome = varchar("nome", 100)
    val sigla = varchar("sigla", 10).nullable()
    val status = varchar("status", 20).default("ativo")

    init {
        uniqueIndex(idPais, nome)
    }
}

object CidadesTable : LongIdTable("cidade") {
    val idDivisao = reference("id_divisao", DivisoesTable)
    val nome = varchar("nome", 150)
    val tipo = varchar("tipo", 20).default("municipio")
    val idCidadeMunicipio = long("id_cidade_municipio").nullable()
    val idPaiChave = long("id_pai_chave").default(0)
    val status = varchar("status", 20).default("ativo")

    init {
        uniqueIndex(idDivisao, nome, idPaiChave)
    }
}
