package com.monarca.caixa.domain

import com.monarca.common.enums.Status

data class Finalizador(
    val id: Long,
    val nome: String,
    val tipo: TipoFinalizador,
    val status: Status,
)

data class Caixa(
    val id: Long,
    val idFilial: Long,
    val nome: String,
    val status: Status,
)

data class CaixaAcesso(
    val id: Long,
    val nome: String,
    val idFilial: Long,
    val filialNome: String,
    val padrao: Boolean,
)

data class CaixaSessao(
    val id: Long,
    val idCaixa: Long,
    val idUsuarioAbertura: Long,
    val idUsuarioFechamento: Long?,
    val data: String,
    val abertoEm: Long,
    val fechadoEm: Long?,
    val observacaoAbertura: String?,
    val observacaoFechamento: String?,
    val status: StatusSessaoCaixa,
)

data class ValorFinalizador(
    val idFinalizador: Long,
    val valor: Double,
)

data class CaixaMovimentacao(
    val id: Long,
    val idCaixaSessao: Long,
    val tipo: TipoMovimentacaoCaixa,
    val idUsuario: Long,
    val idVenda: Long?,
    val idMovimentacaoPar: Long?,
    val criadoEm: Long,
    val observacao: String?,
    val status: Status,
    val finalizadores: List<ValorFinalizador>,
)
