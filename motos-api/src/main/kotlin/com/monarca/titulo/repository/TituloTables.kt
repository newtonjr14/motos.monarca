package com.monarca.titulo.repository

import com.monarca.caixa.repository.CaixaSessoesTable
import com.monarca.caixa.repository.FinalizadoresTable
import com.monarca.cotacao.repository.CotacoesTable
import com.monarca.empresa.repository.FiliaisTable
import com.monarca.pessoa.repository.ClientesTable
import com.monarca.pessoa.repository.FornecedoresTable
import com.monarca.usuario.repository.UsuariosTable
import com.monarca.venda.repository.VendasTable
import org.jetbrains.exposed.v1.core.dao.id.LongIdTable

object TitulosReceberTable : LongIdTable("titulo_receber") {
    val idFilial = reference("id_filial", FiliaisTable)
    val idCliente = reference("id_cliente", ClientesTable)
    val origem = varchar("origem", 20)
    val idVenda = optReference("id_venda", VendasTable)
    val moeda = varchar("moeda", 3)
    val valor = double("valor")
    val valorPyg = double("valor_pyg")
    val idCotacao = reference("id_cotacao", CotacoesTable)
    val usdPyg = double("usd_pyg")
    val brlPyg = double("brl_pyg")
    val observacao = varchar("observacao", 500).nullable()
    val criadoEm = long("criado_em")
    val status = varchar("status", 20).default("aberto")
}

object ParcelasReceberTable : LongIdTable("parcela_receber") {
    val idTitulo = reference("id_titulo", TitulosReceberTable)
    val numero = integer("numero")
    val vencimento = varchar("vencimento", 10)
    val valor = double("valor")
    val valorPyg = double("valor_pyg")
    val saldo = double("saldo")
    val status = varchar("status", 20).default("aberta")
}

object BaixasReceberTable : LongIdTable("baixa_receber") {
    val idParcela = reference("id_parcela", ParcelasReceberTable)
    val idFinalizador = reference("id_finalizador", FinalizadoresTable)
    val idCaixaSessao = reference("id_caixa_sessao", CaixaSessoesTable)
    val moeda = varchar("moeda", 3)
    val valor = double("valor")
    val valorPyg = double("valor_pyg")
    val desconto = double("desconto")
    val descontoPyg = double("desconto_pyg")
    val acrescimo = double("acrescimo")
    val acrescimoPyg = double("acrescimo_pyg")
    val idUsuario = reference("id_usuario", UsuariosTable)
    val criadoEm = long("criado_em")
    val observacao = varchar("observacao", 500).nullable()
    val status = varchar("status", 20).default("ativo")
}

object TitulosPagarTable : LongIdTable("titulo_pagar") {
    val idFilial = reference("id_filial", FiliaisTable)
    val idFornecedor = reference("id_fornecedor", FornecedoresTable)
    val origem = varchar("origem", 20)
    val idEntrada = long("id_entrada").nullable()
    val moeda = varchar("moeda", 3)
    val valor = double("valor")
    val valorPyg = double("valor_pyg")
    val idCotacao = reference("id_cotacao", CotacoesTable)
    val usdPyg = double("usd_pyg")
    val brlPyg = double("brl_pyg")
    val observacao = varchar("observacao", 500).nullable()
    val criadoEm = long("criado_em")
    val status = varchar("status", 20).default("aberto")
}

object ParcelasPagarTable : LongIdTable("parcela_pagar") {
    val idTitulo = reference("id_titulo", TitulosPagarTable)
    val numero = integer("numero")
    val vencimento = varchar("vencimento", 10)
    val valor = double("valor")
    val valorPyg = double("valor_pyg")
    val saldo = double("saldo")
    val status = varchar("status", 20).default("aberta")
}

object BaixasPagarTable : LongIdTable("baixa_pagar") {
    val idParcela = reference("id_parcela", ParcelasPagarTable)
    val idFinalizador = reference("id_finalizador", FinalizadoresTable)
    val idCaixaSessao = reference("id_caixa_sessao", CaixaSessoesTable)
    val moeda = varchar("moeda", 3)
    val valor = double("valor")
    val valorPyg = double("valor_pyg")
    val desconto = double("desconto")
    val descontoPyg = double("desconto_pyg")
    val acrescimo = double("acrescimo")
    val acrescimoPyg = double("acrescimo_pyg")
    val idUsuario = reference("id_usuario", UsuariosTable)
    val criadoEm = long("criado_em")
    val observacao = varchar("observacao", 500).nullable()
    val status = varchar("status", 20).default("ativo")
}
