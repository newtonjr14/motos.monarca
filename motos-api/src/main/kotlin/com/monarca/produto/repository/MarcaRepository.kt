package com.monarca.produto.repository

import com.monarca.produto.domain.Marca
import com.monarca.produto.domain.Modelo
import com.monarca.produto.domain.ModeloDetalhe
import com.monarca.produto.domain.TipoProduto

interface MarcaRepository {
    suspend fun listar(): List<Marca>
    suspend fun buscar(id: Long): Marca?
    suspend fun existeNome(nome: String, ignorarId: Long? = null): Boolean
    suspend fun inserir(marca: Marca): Long
    suspend fun atualizar(id: Long, marca: Marca): Boolean
    suspend fun excluir(id: Long): Boolean
    suspend fun temModelos(idMarca: Long): Boolean
    suspend fun atualizarNomesProdutosDaMarca(idMarca: Long)

    suspend fun listarModelos(idMarca: Long?, tipo: TipoProduto?): List<ModeloDetalhe>
    suspend fun buscarModelo(id: Long): ModeloDetalhe?
    suspend fun existeNomeModelo(idMarca: Long, nome: String, ignorarId: Long? = null): Boolean
    suspend fun inserirModelo(modelo: Modelo): Long
    suspend fun atualizarModelo(id: Long, modelo: Modelo): Boolean
    suspend fun excluirModelo(id: Long): Boolean
    suspend fun temProdutos(idModelo: Long): Boolean
    suspend fun atualizarNomesProdutosDoModelo(idModelo: Long)
    suspend fun sincronizarMarcaDosProdutos(idModelo: Long, idMarca: Long)
}
