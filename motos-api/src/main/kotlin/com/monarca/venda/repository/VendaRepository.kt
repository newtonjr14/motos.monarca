package com.monarca.venda.repository

import com.monarca.titulo.repository.TituloReceberNovo

data class VendaItemPersistencia(
    val id: Long = 0,
    val idProduto: Long,
    val produtoCodigo: String,
    val produtoNome: String,
    val idEstoque: Long,
    val estoqueNome: String,
    val quantidade: Int,
    val aliquotaIva: Int,
    val moedaPreco: String,
    val precoLista: Double,
    val precoUnitarioPyg: Double,
    val descontoPct: Double = 0.0,
    val descontoPyg: Double = 0.0,
    val totalPyg: Double,
    val idsUnidades: List<Long> = emptyList(),
    val chassis: List<String> = emptyList(),
)

data class VendaNegociacaoPersistencia(
    val id: Long = 0,
    val idFinalizador: Long,
    val finalizadorNome: String,
    val moeda: String,
    val valor: Double,
    val valorPyg: Double,
    val quantidadeParcelas: Int? = null,
)

data class VendaCompleta(
    val id: Long,
    val idFilial: Long,
    val filialNome: String,
    val idCliente: Long,
    val clienteNome: String,
    val idVendedor: Long,
    val vendedorNome: String,
    val idCaixaSessao: Long,
    val idCotacao: Long,
    val clienteEndereco: String? = null,
    val clienteTelefone: String? = null,
    val validade: String? = null,
    val idVendaGerada: Long? = null,
    val usdPyg: Double,
    val brlPyg: Double,
    val totalPyg: Double,
    val descontoPct: Double = 0.0,
    val descontoPyg: Double = 0.0,
    val observacao: String?,
    val criadoEm: Long,
    val status: String,
    val itens: List<VendaItemPersistencia>,
    val negociacao: List<VendaNegociacaoPersistencia>,
)

interface VendaRepository {
    suspend fun listar(idFilial: Long): List<VendaCompleta>
    suspend fun buscar(id: Long): VendaCompleta?
    suspend fun inserir(
        idFilial: Long,
        idCliente: Long,
        idVendedor: Long,
        idCaixaSessao: Long?,
        idCotacao: Long,
        totalPyg: Double,
        descontoPct: Double,
        descontoPyg: Double,
        observacao: String?,
        itens: List<VendaItemPersistencia>,
        negociacao: List<VendaNegociacaoPersistencia>,
        negociacaoCaixa: List<VendaNegociacaoPersistencia>,
        tituloReceber: TituloReceberNovo?,
        idUsuario: Long,
        status: String,
        validade: String?,
        efetivar: Boolean,
        idsOrcamentos: List<Long>,
        hoje: String,
        confirmarVencido: Boolean,
    ): Long

    suspend fun cancelar(id: Long)

    suspend fun efetivar(
        idVenda: Long,
        idCaixaSessao: Long,
        idCotacao: Long,
        totalPyg: Double,
        descontoPct: Double,
        descontoPyg: Double,
        observacao: String?,
        itens: List<VendaItemPersistencia>,
        negociacao: List<VendaNegociacaoPersistencia>,
        negociacaoCaixa: List<VendaNegociacaoPersistencia>,
        tituloReceber: TituloReceberNovo?,
        idUsuario: Long,
    )
}
