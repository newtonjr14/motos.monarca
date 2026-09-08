package com.monarca.venda.repository

import com.monarca.caixa.repository.CaixaSessoesTable
import com.monarca.caixa.repository.FinalizadoresTable
import com.monarca.cotacao.repository.CotacoesTable
import com.monarca.empresa.repository.FiliaisTable
import com.monarca.estoque.repository.EstoquesTable
import com.monarca.pessoa.repository.ClientesTable
import com.monarca.produto.repository.ProdutosTable
import com.monarca.usuario.repository.UsuariosTable
import org.jetbrains.exposed.v1.core.dao.id.LongIdTable

object VendasTable : LongIdTable("venda") {
    val idFilial = reference("id_filial", FiliaisTable)
    val idCliente = reference("id_cliente", ClientesTable)
    val idVendedor = reference("id_vendedor", UsuariosTable)
    val idCaixaSessao = reference("id_caixa_sessao", CaixaSessoesTable)
    val idCotacao = reference("id_cotacao", CotacoesTable)
    val totalPyg = double("total_pyg")
    val observacao = varchar("observacao", 500).nullable()
    val criadoEm = long("criado_em")
    val status = varchar("status", 20).default("finalizada")
}

object VendaItensTable : LongIdTable("venda_item") {
    val idVenda = reference("id_venda", VendasTable)
    val idProduto = reference("id_produto", ProdutosTable)
    val idEstoque = reference("id_estoque", EstoquesTable)
    val quantidade = integer("quantidade")
    val aliquotaIva = integer("aliquota_iva")
    val moedaPreco = varchar("moeda_preco", 3)
    val precoLista = double("preco_lista")
    val precoUnitarioPyg = double("preco_unitario_pyg")
    val totalPyg = double("total_pyg")
}

object VendaNegociacoesTable : LongIdTable("venda_negociacao") {
    val idVenda = reference("id_venda", VendasTable)
    val idFinalizador = reference("id_finalizador", FinalizadoresTable)
    val valor = double("valor")
}
