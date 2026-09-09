package com.monarca.caixa.repository

import com.monarca.empresa.repository.FiliaisTable
import com.monarca.usuario.repository.UsuariosTable
import com.monarca.venda.repository.VendasTable
import org.jetbrains.exposed.v1.core.dao.id.LongIdTable

object FinalizadoresTable : LongIdTable("finalizador") {
    val nome = varchar("nome", 80)
    val tipo = varchar("tipo", 20)
    val status = varchar("status", 20).default("ativo")
}

object CaixasTable : LongIdTable("caixa") {
    val idFilial = reference("id_filial", FiliaisTable)
    val nome = varchar("nome", 80)
    val status = varchar("status", 20).default("ativo")
}

object UsuarioCaixasTable : LongIdTable("usuario_caixa") {
    val idUsuario = reference("id_usuario", UsuariosTable)
    val idCaixa = reference("id_caixa", CaixasTable)
    val padrao = bool("padrao").default(false)
    val status = varchar("status", 20).default("ativo")

    init {
        uniqueIndex(idUsuario, idCaixa)
    }
}

object CaixaSessoesTable : LongIdTable("caixa_sessao") {
    val idCaixa = reference("id_caixa", CaixasTable)
    val idUsuarioAbertura = reference("id_usuario_abertura", UsuariosTable)
    val idUsuarioFechamento = optReference("id_usuario_fechamento", UsuariosTable)
    val data = varchar("data", 10)
    val abertoEm = long("aberto_em")
    val fechadoEm = long("fechado_em").nullable()
    val observacaoAbertura = varchar("observacao_abertura", 500).nullable()
    val observacaoFechamento = varchar("observacao_fechamento", 500).nullable()
    val status = varchar("status", 20)
}

object CaixaMovimentacoesTable : LongIdTable("caixa_movimentacao") {
    val idCaixaSessao = reference("id_caixa_sessao", CaixaSessoesTable)
    val tipo = varchar("tipo", 30)
    val idUsuario = reference("id_usuario", UsuariosTable)
    val idVenda = optReference("id_venda", VendasTable)
    val idMovimentacaoPar = long("id_movimentacao_par").nullable()
    val criadoEm = long("criado_em")
    val observacao = varchar("observacao", 500).nullable()
    val status = varchar("status", 20).default("ativo")
}

object CaixaMovimentacaoFinalizadoresTable : LongIdTable("caixa_movimentacao_finalizador") {
    val idCaixaMovimentacao = reference("id_caixa_movimentacao", CaixaMovimentacoesTable)
    val idFinalizador = reference("id_finalizador", FinalizadoresTable)
    val moeda = varchar("moeda", 3).default("pyg")
    val valor = double("valor")
    val valorPyg = double("valor_pyg")
}
