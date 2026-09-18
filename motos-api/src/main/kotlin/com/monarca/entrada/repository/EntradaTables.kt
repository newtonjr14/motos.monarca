package com.monarca.entrada.repository

import com.monarca.caixa.repository.CaixaSessoesTable
import com.monarca.caixa.repository.FinalizadoresTable
import com.monarca.cotacao.repository.CotacoesTable
import com.monarca.empresa.repository.FiliaisTable
import com.monarca.estoque.repository.EstoquesTable
import com.monarca.pessoa.repository.FornecedoresTable
import com.monarca.produto.repository.ProdutoUnidadesTable
import com.monarca.produto.repository.ProdutosTable
import org.jetbrains.exposed.v1.core.dao.id.LongIdTable

object EntradasTable : LongIdTable("entrada") {
    val idFilial = reference("id_filial", FiliaisTable)
    val idFornecedor = reference("id_fornecedor", FornecedoresTable)
    val tipoDocumento = varchar("tipo_documento", 20)
    val dataEmissao = varchar("data_emissao", 10)
    val moeda = varchar("moeda", 3)
    val valor = double("valor")
    val valorPyg = double("valor_pyg")
    val idCotacao = reference("id_cotacao", CotacoesTable)
    val usdPyg = double("usd_pyg")
    val brlPyg = double("brl_pyg")
    val timbrado = varchar("timbrado", 20).nullable()
    val establecimiento = varchar("establecimiento", 10).nullable()
    val puntoExpedicion = varchar("punto_expedicion", 10).nullable()
    val numero = varchar("numero", 20).nullable()
    val cdc = varchar("cdc", 44).nullable()
    val condicion = varchar("condicion", 20).nullable()
    val numeroDocumento = varchar("numero_documento", 60).nullable()
    val incoterm = varchar("incoterm", 20).nullable()
    val idCaixaSessao = optReference("id_caixa_sessao", CaixaSessoesTable)
    val observacao = varchar("observacao", 500).nullable()
    val criadoEm = long("criado_em")
    val status = varchar("status", 20).default("finalizada")
}

object EntradaItensTable : LongIdTable("entrada_item") {
    val idEntrada = reference("id_entrada", EntradasTable)
    val idProduto = reference("id_produto", ProdutosTable)
    val idEstoque = reference("id_estoque", EstoquesTable)
    val quantidade = integer("quantidade")
    val aliquotaIva = integer("aliquota_iva")
    val moeda = varchar("moeda", 3)
    val valorUnitario = double("valor_unitario")
    val valor = double("valor")
    val valorPyg = double("valor_pyg")
}

object EntradaItemUnidadesTable : LongIdTable("entrada_item_unidade") {
    val idEntradaItem = reference("id_entrada_item", EntradaItensTable)
    val idProdutoUnidade = reference("id_produto_unidade", ProdutoUnidadesTable)
}

object EntradaNegociacoesTable : LongIdTable("entrada_negociacao") {
    val idEntrada = reference("id_entrada", EntradasTable)
    val idFinalizador = reference("id_finalizador", FinalizadoresTable)
    val moeda = varchar("moeda", 3)
    val valor = double("valor")
    val valorPyg = double("valor_pyg")
}
