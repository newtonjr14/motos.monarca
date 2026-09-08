package com.monarca.cotacao.repository

import com.monarca.cotacao.domain.Cotacao

interface CotacaoRepository {
    suspend fun listar(): List<Cotacao>
    suspend fun buscar(id: Long): Cotacao?
    suspend fun buscarPorData(data: String): Cotacao?
    suspend fun inserir(cotacao: Cotacao): Long
    suspend fun atualizar(id: Long, cotacao: Cotacao): Boolean
    suspend fun excluir(id: Long): Boolean
}
