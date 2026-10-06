package com.monarca.estoque.repository

import com.monarca.empresa.repository.FiliaisTable
import com.monarca.produto.repository.ProdutosTable
import com.monarca.usuario.repository.UsuariosTable
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

object EstoqueMovimentosTable : LongIdTable("estoque_movimento") {
    val idFilial = reference("id_filial", FiliaisTable)
    val idEstoque = reference("id_estoque", EstoquesTable)
    val idProduto = reference("id_produto", ProdutosTable)
    val tipo = varchar("tipo", 20)
    val quantidade = integer("quantidade")
    val saldoDepois = integer("saldo_depois")
    val idDocumento = long("id_documento").nullable()
    val observacao = varchar("observacao", 240).nullable()
    val idUsuario = optReference("id_usuario", UsuariosTable)
    val criadoEm = long("criado_em")
}
