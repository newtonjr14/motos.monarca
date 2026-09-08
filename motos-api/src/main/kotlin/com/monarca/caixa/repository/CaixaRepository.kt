package com.monarca.caixa.repository

import com.monarca.caixa.domain.Caixa
import com.monarca.caixa.domain.CaixaAcesso
import com.monarca.caixa.domain.CaixaMovimentacao
import com.monarca.caixa.domain.CaixaSessao
import com.monarca.caixa.domain.Finalizador
import com.monarca.caixa.domain.ValorFinalizador
import com.monarca.common.enums.Status

data class CaixaDetalhe(
    val caixa: Caixa,
    val filialNome: String,
    val sessaoAbertaId: Long?,
)

data class SessaoDetalhe(
    val sessao: CaixaSessao,
    val caixaNome: String,
    val idFilial: Long,
    val usuarioAberturaNome: String,
    val saldos: List<ValorFinalizador>,
)

data class MovimentacaoDetalhe(
    val movimento: CaixaMovimentacao,
    val usuarioNome: String,
    val finalizadorNomes: Map<Long, String>,
)

interface CaixaRepository {
    suspend fun listarFinalizadores(): List<Finalizador>
    suspend fun buscarFinalizador(id: Long): Finalizador?
    suspend fun existeFinalizadorNome(nome: String, ignorarId: Long? = null): Boolean
    suspend fun inserirFinalizador(item: Finalizador): Long
    suspend fun atualizarFinalizador(id: Long, item: Finalizador): Boolean
    suspend fun excluirFinalizador(id: Long): Boolean
    suspend fun finalizadorEmUso(id: Long): Boolean

    suspend fun listarCaixas(idFilial: Long): List<CaixaDetalhe>
    suspend fun buscarCaixa(id: Long): CaixaDetalhe?
    suspend fun existeCaixaNome(idFilial: Long, nome: String, ignorarId: Long? = null): Boolean
    suspend fun inserirCaixa(caixa: Caixa): Long
    suspend fun atualizarCaixa(id: Long, caixa: Caixa): Boolean
    suspend fun excluirCaixa(id: Long): Boolean
    suspend fun caixaTemSessao(id: Long): Boolean

    suspend fun listarAcessos(idUsuario: Long): List<CaixaAcesso>
    suspend fun temAcessoCaixa(idUsuario: Long, idCaixa: Long): Boolean
    suspend fun substituirAcessos(idUsuario: Long, idsCaixas: List<Long>, idCaixaPadrao: Long?)
    suspend fun vincularUsuariosDaFilial(idCaixa: Long, idFilial: Long)

    suspend fun buscarSessaoAberta(idCaixa: Long): CaixaSessao?
    suspend fun buscarSessao(id: Long): SessaoDetalhe?
    suspend fun listarSessoes(idCaixa: Long): List<SessaoDetalhe>
    suspend fun abrirSessao(sessao: CaixaSessao, conferencia: List<ValorFinalizador>, idUsuario: Long): Long
    suspend fun fecharSessao(id: Long, sessao: CaixaSessao, conferencia: List<ValorFinalizador>, idUsuario: Long): Boolean
    suspend fun transferir(
        idSessaoOrigem: Long,
        idSessaoDestino: Long,
        valores: List<ValorFinalizador>,
        idUsuario: Long,
        observacao: String?,
    )
    suspend fun listarMovimentacoes(idSessao: Long): List<MovimentacaoDetalhe>
    suspend fun saldosSessao(idSessao: Long): List<ValorFinalizador>
    suspend fun registrarMovimentoVenda(
        idSessao: Long,
        idVenda: Long,
        idUsuario: Long,
        valores: List<ValorFinalizador>,
    )
}
