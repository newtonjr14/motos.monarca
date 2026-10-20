package com.monarca.devolucao.repository

import com.monarca.caixa.repository.CaixaSessoesTable
import com.monarca.caixa.repository.FinalizadoresTable
import com.monarca.cotacao.repository.CotacoesTable
import com.monarca.empresa.repository.FiliaisTable
import com.monarca.pessoa.repository.ClientesTable
import com.monarca.produto.repository.ProdutoUnidadesTable
import com.monarca.usuario.repository.UsuariosTable
import com.monarca.venda.repository.VendaItensTable
import com.monarca.venda.repository.VendasTable
import org.jetbrains.exposed.v1.core.dao.id.LongIdTable

object DevolucoesTable : LongIdTable("devolucao") {
    val idFilial = reference("id_filial", FiliaisTable)
    val idVenda = reference("id_venda", VendasTable)
    val idCliente = reference("id_cliente", ClientesTable)
    val valorPyg = double("valor_pyg")
    val abatidoPyg = double("abatido_pyg")
    val excessoPyg = double("excesso_pyg")
    val tratamento = varchar("tratamento", 20)
    val idFinalizador = optReference("id_finalizador", FinalizadoresTable)
    val moedaCaixa = varchar("moeda_caixa", 3).nullable()
    val valorCaixa = double("valor_caixa").nullable()
    val idCaixaSessao = optReference("id_caixa_sessao", CaixaSessoesTable)
    val idCotacao = reference("id_cotacao", CotacoesTable)
    val usdPyg = double("usd_pyg")
    val brlPyg = double("brl_pyg")
    val observacao = varchar("observacao", 500).nullable()
    val criadoEm = long("criado_em")
    val idUsuario = reference("id_usuario", UsuariosTable)
    val status = varchar("status", 20).default("finalizada")
}

object DevolucaoItensTable : LongIdTable("devolucao_item") {
    val idDevolucao = reference("id_devolucao", DevolucoesTable)
    val idVendaItem = reference("id_venda_item", VendaItensTable)
    val quantidade = integer("quantidade")
    val valorPyg = double("valor_pyg")
}

object DevolucaoItemUnidadesTable : LongIdTable("devolucao_item_unidade") {
    val idDevolucaoItem = reference("id_devolucao_item", DevolucaoItensTable)
    val idProdutoUnidade = reference("id_produto_unidade", ProdutoUnidadesTable)
}

object ClienteCreditoTable : LongIdTable("cliente_credito") {
    val idFilial = reference("id_filial", FiliaisTable)
    val idCliente = reference("id_cliente", ClientesTable)
    val idDevolucao = optReference("id_devolucao", DevolucoesTable)
    val idVenda = optReference("id_venda", VendasTable)
    val valorPyg = double("valor_pyg")
    val criadoEm = long("criado_em")
    val status = varchar("status", 20).default("ativo")
}
