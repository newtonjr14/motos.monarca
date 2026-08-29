package com.monarca.localidade.repository

import com.monarca.localidade.domain.CidadeDetalhe
import com.monarca.localidade.domain.Divisao
import com.monarca.localidade.domain.Pais
import com.monarca.common.enums.Status

interface LocalidadeRepository {
    suspend fun inicializar()

    suspend fun listarPaises(): List<Pais>
    suspend fun buscarPais(id: Long): Pais?
    suspend fun existePaisPorSigla(sigla: String, ignorarId: Long? = null): Boolean
    suspend fun inserirPais(nome: String, sigla: String, usaSiglaDivisao: Boolean, status: Status): Long
    suspend fun atualizarPais(id: Long, nome: String, sigla: String, usaSiglaDivisao: Boolean, status: Status): Boolean
    suspend fun excluirPais(id: Long): Boolean
    suspend fun contarCidadesNaoDeletadasDoPais(idPais: Long): Long

    suspend fun listarDivisoes(idPais: Long?): List<Divisao>
    suspend fun buscarDivisao(id: Long): Divisao?
    suspend fun existeDivisao(idPais: Long, nome: String, ignorarId: Long? = null): Boolean
    suspend fun inserirDivisao(nome: String, idPais: Long, sigla: String?, status: Status): Long
    suspend fun atualizarDivisao(id: Long, nome: String, idPais: Long, sigla: String?, status: Status): Boolean
    suspend fun excluirDivisao(id: Long): Boolean
    suspend fun contarCidadesNaoDeletadasDaDivisao(idDivisao: Long): Long

    suspend fun listarCidades(idPais: Long?, idDivisao: Long?): List<CidadeDetalhe>
    suspend fun buscarCidade(id: Long): CidadeDetalhe?
    suspend fun existeCidade(idDivisao: Long, nome: String, ignorarId: Long? = null): Boolean
    suspend fun inserirCidade(nome: String, idDivisao: Long, status: Status): Long
    suspend fun atualizarCidade(id: Long, nome: String, idDivisao: Long, status: Status): Boolean
    suspend fun excluirCidade(id: Long): Boolean
}
