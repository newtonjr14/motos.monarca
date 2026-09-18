package com.monarca.entrada.repository

import com.monarca.entrada.domain.CondicionEntrada
import com.monarca.entrada.domain.StatusEntrada
import com.monarca.entrada.domain.TipoDocumentoEntrada
import com.monarca.produto.domain.Moeda
import com.monarca.titulo.repository.TituloPagarNovo

data class EntradaItemPersistencia(
    val idProduto: Long,
    val produtoCodigo: String,
    val produtoNome: String,
    val idEstoque: Long,
    val estoqueNome: String,
    val quantidade: Int,
    val aliquotaIva: Int,
    val moeda: Moeda,
    val valorUnitario: Double,
    val valor: Double,
    val valorPyg: Double,
    val numerosChassis: List<String>,
)

data class EntradaNegociacaoPersistencia(
    val idFinalizador: Long,
    val moeda: String,
    val valor: Double,
    val valorPyg: Double,
)

data class EntradaNova(
    val idFilial: Long,
    val idFornecedor: Long,
    val tipoDocumento: TipoDocumentoEntrada,
    val dataEmissao: String,
    val moeda: Moeda,
    val valor: Double,
    val valorPyg: Double,
    val idCotacao: Long,
    val usdPyg: Double,
    val brlPyg: Double,
    val timbrado: String?,
    val establecimiento: String?,
    val puntoExpedicion: String?,
    val numero: String?,
    val cdc: String?,
    val condicion: CondicionEntrada?,
    val numeroDocumento: String?,
    val incoterm: String?,
    val idCaixaSessao: Long?,
    val observacao: String?,
    val itens: List<EntradaItemPersistencia>,
    val negociacao: List<EntradaNegociacaoPersistencia>,
    val negociacaoCaixa: List<EntradaNegociacaoPersistencia>,
    val tituloPagar: TituloPagarNovo?,
    val idUsuario: Long,
)

data class EntradaItemCompleto(
    val id: Long,
    val idProduto: Long,
    val produtoCodigo: String,
    val produtoNome: String,
    val idEstoque: Long,
    val estoqueNome: String,
    val quantidade: Int,
    val aliquotaIva: Int,
    val moeda: Moeda,
    val valorUnitario: Double,
    val valor: Double,
    val valorPyg: Double,
    val chassis: List<String>,
)

data class EntradaNegociacaoCompleta(
    val id: Long,
    val idFinalizador: Long,
    val finalizadorNome: String,
    val moeda: Moeda,
    val valor: Double,
    val valorPyg: Double,
)

data class EntradaCompleta(
    val id: Long,
    val idFilial: Long,
    val filialNome: String,
    val idFornecedor: Long,
    val fornecedorNome: String,
    val tipoDocumento: TipoDocumentoEntrada,
    val dataEmissao: String,
    val moeda: Moeda,
    val valor: Double,
    val valorPyg: Double,
    val idCotacao: Long,
    val usdPyg: Double,
    val brlPyg: Double,
    val timbrado: String?,
    val establecimiento: String?,
    val puntoExpedicion: String?,
    val numero: String?,
    val cdc: String?,
    val condicion: CondicionEntrada?,
    val numeroDocumento: String?,
    val incoterm: String?,
    val idCaixaSessao: Long?,
    val idTituloPagar: Long?,
    val observacao: String?,
    val criadoEm: Long,
    val status: StatusEntrada,
    val itens: List<EntradaItemCompleto>,
    val negociacao: List<EntradaNegociacaoCompleta>,
)

interface EntradaRepository {
    suspend fun listar(idFilial: Long): List<EntradaCompleta>
    suspend fun buscar(id: Long): EntradaCompleta?
    suspend fun existePyDuplicada(
        idFilial: Long,
        idFornecedor: Long,
        timbrado: String,
        establecimiento: String,
        puntoExpedicion: String,
        numero: String,
    ): Boolean
    suspend fun inserir(entrada: EntradaNova): Long
}
