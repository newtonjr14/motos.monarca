package com.monarca.titulo.repository

import com.monarca.produto.domain.Moeda
import com.monarca.titulo.ParcelaGerada
import com.monarca.titulo.domain.OrigemTitulo
import com.monarca.titulo.domain.StatusParcela
import com.monarca.titulo.domain.StatusTitulo

data class TituloReceberNovo(
    val idFilial: Long,
    val idCliente: Long,
    val origem: OrigemTitulo,
    val idVenda: Long?,
    val moeda: Moeda,
    val valor: Double,
    val valorPyg: Double,
    val idCotacao: Long,
    val usdPyg: Double,
    val brlPyg: Double,
    val observacao: String?,
    val parcelas: List<ParcelaGerada>,
)

data class TituloPagarNovo(
    val idFilial: Long,
    val idFornecedor: Long,
    val origem: OrigemTitulo,
    val idEntrada: Long? = null,
    val moeda: Moeda,
    val valor: Double,
    val valorPyg: Double,
    val idCotacao: Long,
    val usdPyg: Double,
    val brlPyg: Double,
    val observacao: String?,
    val parcelas: List<ParcelaGerada>,
)

data class ParcelaPersistida(
    val id: Long,
    val idTitulo: Long,
    val numero: Int,
    val vencimento: String,
    val valor: Double,
    val valorPyg: Double,
    val saldo: Double,
    val status: StatusParcela,
)

data class BaixaPersistida(
    val id: Long,
    val idParcela: Long,
    val idFinalizador: Long,
    val finalizadorNome: String,
    val idCaixaSessao: Long,
    val moeda: Moeda,
    val valor: Double,
    val valorPyg: Double,
    val desconto: Double = 0.0,
    val descontoPyg: Double = 0.0,
    val acrescimo: Double = 0.0,
    val acrescimoPyg: Double = 0.0,
    val idUsuario: Long,
    val criadoEm: Long,
    val observacao: String?,
)

data class TituloReceberCompleto(
    val id: Long,
    val idFilial: Long,
    val filialNome: String,
    val idCliente: Long,
    val clienteNome: String,
    val origem: OrigemTitulo,
    val idVenda: Long?,
    val moeda: Moeda,
    val valor: Double,
    val valorPyg: Double,
    val idCotacao: Long,
    val usdPyg: Double,
    val brlPyg: Double,
    val observacao: String?,
    val criadoEm: Long,
    val status: StatusTitulo,
    val parcelas: List<ParcelaPersistida>,
    val baixas: List<BaixaPersistida>,
)

data class TituloPagarCompleto(
    val id: Long,
    val idFilial: Long,
    val filialNome: String,
    val idFornecedor: Long,
    val fornecedorNome: String,
    val origem: OrigemTitulo,
    val moeda: Moeda,
    val valor: Double,
    val valorPyg: Double,
    val idCotacao: Long,
    val usdPyg: Double,
    val brlPyg: Double,
    val observacao: String?,
    val criadoEm: Long,
    val status: StatusTitulo,
    val parcelas: List<ParcelaPersistida>,
    val baixas: List<BaixaPersistida>,
)

data class BaixaNova(
    val idParcela: Long,
    val idFinalizador: Long,
    val idCaixaSessao: Long,
    val moeda: Moeda,
    val valor: Double,
    val valorPyg: Double,
    val idUsuario: Long,
    val observacao: String?,
    val tipoMovimento: String,
)

data class BaixaParcelaAplicacao(
    val idParcela: Long,
    val valor: Double,
    val valorPyg: Double,
    val saldoRestante: Double,
    val statusParcela: StatusParcela,
    val desconto: Double = 0.0,
    val descontoPyg: Double = 0.0,
    val acrescimo: Double = 0.0,
    val acrescimoPyg: Double = 0.0,
)

data class BaixaRelatorioLinha(
    val id: Long,
    val criadoEm: Long,
    val pessoaNome: String,
    val moeda: Moeda,
    val valor: Double,
    val valorPyg: Double,
    val desconto: Double,
    val descontoPyg: Double,
    val acrescimo: Double,
    val acrescimoPyg: Double,
    val finalizadorNome: String,
)

interface TituloRepository {
    suspend fun listarReceber(idFilial: Long): List<TituloReceberCompleto>
    suspend fun buscarReceber(id: Long): TituloReceberCompleto?
    suspend fun inserirReceber(titulo: TituloReceberNovo): Long
    suspend fun baixarReceber(baixa: BaixaNova, saldoRestanteParcela: Double, statusParcela: StatusParcela, statusTitulo: StatusTitulo): Long
    suspend fun baixarReceberLote(
        aplicacoes: List<BaixaParcelaAplicacao>,
        comum: BaixaNova,
        idTitulo: Long,
        statusTitulo: StatusTitulo,
    )

    suspend fun listarPagar(idFilial: Long): List<TituloPagarCompleto>
    suspend fun buscarPagar(id: Long): TituloPagarCompleto?
    suspend fun inserirPagar(titulo: TituloPagarNovo): Long
    suspend fun baixarPagar(baixa: BaixaNova, saldoRestanteParcela: Double, statusParcela: StatusParcela, statusTitulo: StatusTitulo): Long
    suspend fun baixarPagarLote(
        aplicacoes: List<BaixaParcelaAplicacao>,
        comum: BaixaNova,
        idTitulo: Long,
        statusTitulo: StatusTitulo,
    )

    suspend fun buscarParcelaReceber(idParcela: Long): Pair<TituloReceberCompleto, ParcelaPersistida>?
    suspend fun buscarParcelaPagar(idParcela: Long): Pair<TituloPagarCompleto, ParcelaPersistida>?

    suspend fun listarBaixasReceber(idFilial: Long): List<BaixaRelatorioLinha>
    suspend fun listarBaixasPagar(idFilial: Long): List<BaixaRelatorioLinha>
}
