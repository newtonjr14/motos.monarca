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
}
