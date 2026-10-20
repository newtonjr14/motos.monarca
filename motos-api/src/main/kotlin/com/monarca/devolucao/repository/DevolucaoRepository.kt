package com.monarca.devolucao.repository

data class ChassisDevolucao(
    val id: Long,
    val numero: String,
)

data class ItemDevolucaoDisponivel(
    val idVendaItem: Long,
    val idProduto: Long,
    val idEstoque: Long,
    val produtoCodigo: String,
    val produtoNome: String,
    val controlaChassi: Boolean,
    val quantidadeVendida: Int,
    val quantidadeDevolvida: Int,
    val totalPyg: Double,
    val chassis: List<ChassisDevolucao>,
)

data class VendaParaDevolucao(
    val id: Long,
    val idFilial: Long,
    val idCliente: Long,
    val clienteNome: String,
    val totalPyg: Double,
    val abertoPyg: Double,
    val idCotacao: Long,
    val usdPyg: Double,
    val brlPyg: Double,
    val status: String,
    val itens: List<ItemDevolucaoDisponivel>,
)

data class DevolucaoItemNova(
    val idVendaItem: Long,
    val idProduto: Long,
    val idEstoque: Long,
    val quantidade: Int,
    val valorPyg: Double,
    val idsUnidades: List<Long>,
)

data class DevolucaoNova(
    val idFilial: Long,
    val idVenda: Long,
    val idCliente: Long,
    val valorPyg: Double,
    val abatidoPyg: Double,
    val excessoPyg: Double,
    val tratamento: String,
    val idFinalizador: Long?,
    val moedaCaixa: String?,
    val valorCaixa: Double?,
    val idCaixaSessao: Long?,
    val idCotacao: Long,
    val usdPyg: Double,
    val brlPyg: Double,
    val observacao: String?,
    val idUsuario: Long,
    val itens: List<DevolucaoItemNova>,
)

data class DevolucaoItemLista(
    val id: Long,
    val produtoCodigo: String,
    val produtoNome: String,
    val quantidade: Int,
    val valorPyg: Double,
    val chassis: List<String>,
)

data class DevolucaoLista(
    val id: Long,
    val idVenda: Long,
    val clienteNome: String,
    val valorPyg: Double,
    val abatidoPyg: Double,
    val excessoPyg: Double,
    val tratamento: String,
    val criadoEm: Long,
    val itens: List<DevolucaoItemLista>,
)

interface DevolucaoRepository {
    suspend fun vendaParaDevolucao(idVenda: Long): VendaParaDevolucao?
    suspend fun saldoCredito(idFilial: Long, idCliente: Long): Double
    suspend fun inserir(devolucao: DevolucaoNova): Long
    suspend fun listar(idFilial: Long): List<DevolucaoLista>
    suspend fun buscar(id: Long): DevolucaoLista?
}
