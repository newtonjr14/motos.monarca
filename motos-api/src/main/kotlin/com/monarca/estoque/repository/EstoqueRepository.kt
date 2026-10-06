package com.monarca.estoque.repository

import com.monarca.estoque.domain.Estoque
import com.monarca.estoque.domain.EstoqueDetalhe
import com.monarca.estoque.domain.EstoqueProduto
import com.monarca.estoque.domain.EstoqueProdutoDetalhe

interface EstoqueRepository {
    suspend fun listar(idFilial: Long): List<EstoqueDetalhe>
    suspend fun buscar(id: Long): EstoqueDetalhe?
    suspend fun existeNome(idFilial: Long, nome: String, ignorarId: Long? = null): Boolean
    suspend fun inserir(estoque: Estoque): Long
    suspend fun atualizar(id: Long, estoque: Estoque): Boolean
    suspend fun excluir(id: Long): Boolean
    suspend fun excluirPorFilial(idFilial: Long)
    suspend fun temItens(idEstoque: Long): Boolean
    suspend fun temItensNaFilial(idFilial: Long): Boolean

    suspend fun listarItens(idEstoque: Long): List<EstoqueProdutoDetalhe>
    suspend fun listarItensPorFilial(idFilial: Long): List<EstoqueProdutoDetalhe>
    suspend fun buscarItem(id: Long): EstoqueProdutoDetalhe?
    suspend fun buscarItemPorEstoqueProduto(idEstoque: Long, idProduto: Long): EstoqueProdutoDetalhe?
    suspend fun inserirItem(item: EstoqueProduto): Long
    suspend fun atualizarItem(id: Long, item: EstoqueProduto): Boolean
    suspend fun excluirItem(id: Long): Boolean
    suspend fun produtoEmEstoque(idProduto: Long): Boolean

    suspend fun listarMovimentos(idFilial: Long, idProduto: Long?): List<EstoqueMovimentoLinha>
    suspend fun registrarMovimento(
        idEstoque: Long,
        idProduto: Long,
        tipo: String,
        quantidade: Int,
        saldoDepois: Int,
        idDocumento: Long?,
        observacao: String?,
        idUsuario: Long?,
    )
}

data class EstoqueMovimentoLinha(
    val id: Long,
    val criadoEm: Long,
    val idProduto: Long,
    val produtoCodigo: String,
    val produtoNome: String,
    val idEstoque: Long,
    val estoqueNome: String,
    val tipo: String,
    val quantidade: Int,
    val saldoDepois: Int,
    val idDocumento: Long?,
    val observacao: String?,
)
