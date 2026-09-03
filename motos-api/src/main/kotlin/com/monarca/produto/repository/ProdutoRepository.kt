package com.monarca.produto.repository

import com.monarca.common.enums.Status
import com.monarca.pessoa.domain.FilialVinculo
import com.monarca.produto.domain.Produto
import com.monarca.produto.domain.ProdutoBicicleta
import com.monarca.produto.domain.ProdutoCompleto
import com.monarca.produto.domain.ProdutoEstoqueSaldo
import com.monarca.produto.domain.ProdutoMoto
import com.monarca.produto.domain.ProdutoSaldoTotal
import com.monarca.produto.domain.TipoProduto

interface ProdutoRepository {
    suspend fun listar(idFilial: Long?, filtrarPorFilial: Boolean, tipo: TipoProduto?): List<ProdutoCompleto>
    suspend fun buscar(id: Long): ProdutoCompleto?
    suspend fun buscarPorCodigo(codigo: String): ProdutoCompleto?
    suspend fun existeCodigo(codigo: String, ignorarId: Long? = null): Boolean
    suspend fun existeChassi(chassi: String, ignorarIdProduto: Long? = null): Boolean
    suspend fun existeNumeroSerieQuadro(serie: String, ignorarIdProduto: Long? = null): Boolean
    suspend fun inserir(produto: Produto, moto: ProdutoMoto?, bicicleta: ProdutoBicicleta?, idFilial: Long): Long
    suspend fun atualizar(id: Long, produto: Produto, moto: ProdutoMoto?, bicicleta: ProdutoBicicleta?): Boolean
    suspend fun excluir(id: Long, idFilial: Long?): Boolean
    suspend fun produtoEmUso(id: Long): Boolean
    suspend fun vincularFilial(idProduto: Long, idFilial: Long): Boolean
    suspend fun existeVinculoFilial(idProduto: Long, idFilial: Long): Boolean
    suspend fun listarFiliais(idProduto: Long): List<FilialVinculo>
    suspend fun somarEstoquePorFilial(idFilial: Long): Map<Long, ProdutoSaldoTotal>
    suspend fun listarEstoqueDoProduto(idProduto: Long, idFilial: Long): List<ProdutoEstoqueSaldo>
}
