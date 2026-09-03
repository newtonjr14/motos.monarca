package com.monarca.estoque.repository

import com.monarca.empresa.repository.FiliaisTable
import com.monarca.produto.repository.ProdutosTable
import org.jetbrains.exposed.v1.core.dao.id.LongIdTable

object EstoquesTable : LongIdTable("estoque") {
    val idFilial = reference("id_filial", FiliaisTable)
    val nome = varchar("nome", 120)
    val status = varchar("status", 20).default("ativo")
}

object EstoqueProdutosTable : LongIdTable("estoque_produto") {
    val idEstoque = reference("id_estoque", EstoquesTable)
    val idProduto = reference("id_produto", ProdutosTable)
    val quantidade = integer("quantidade").default(0)
    val quantidadeReservada = integer("quantidade_reservada").default(0)
    val status = varchar("status", 20).default("ativo")

    init {
        uniqueIndex(idEstoque, idProduto)
    }
}
