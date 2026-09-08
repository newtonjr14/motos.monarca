package com.monarca.venda.repository

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
    val totalPyg: Double,
)

data class VendaNegociacaoPersistencia(
    val id: Long = 0,
    val idFinalizador: Long,
    val finalizadorNome: String,
    val valor: Double,
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
    val totalPyg: Double,
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
        idCaixaSessao: Long,
        idCotacao: Long,
        totalPyg: Double,
        observacao: String?,
        itens: List<VendaItemPersistencia>,
        negociacao: List<VendaNegociacaoPersistencia>,
        idUsuario: Long,
    ): Long
}
