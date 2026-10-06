package com.monarca.titulo.dto

import com.monarca.produto.domain.Moeda
import com.monarca.titulo.domain.ModoVencimento
import com.monarca.titulo.domain.OrigemTitulo
import com.monarca.titulo.domain.StatusParcela
import com.monarca.titulo.domain.StatusTitulo
import kotlinx.serialization.Serializable

@Serializable
data class ParcelasConfigRequest(
    val quantidade: Int,
    val modoVencimento: ModoVencimento,
    val diaVencimento: Int? = null,
)

@Serializable
data class TituloReceberRequest(
    val idFilial: Long? = null,
    val idCliente: Long,
    val moeda: Moeda,
    val valor: Double,
    val parcelas: ParcelasConfigRequest,
    val observacao: String? = null,
)

@Serializable
data class TituloPagarRequest(
    val idFilial: Long? = null,
    val idFornecedor: Long,
    val moeda: Moeda,
    val valor: Double,
    val parcelas: ParcelasConfigRequest,
    val observacao: String? = null,
)

@Serializable
data class BaixaTituloRequest(
    val idParcela: Long? = null,
    val idsParcelas: List<Long> = emptyList(),
    val idFinalizador: Long,
    val idCaixaSessao: Long? = null,
    val moeda: Moeda = Moeda.PYG,
    val valor: Double,
    val desconto: Double = 0.0,
    val acrescimo: Double = 0.0,
    val observacao: String? = null,
)

@Serializable
data class ParcelaResponse(
    val id: Long,
    val numero: Int,
    val vencimento: String,
    val valor: Double,
    val valorPyg: Double,
    val saldo: Double,
    val status: StatusParcela,
)

@Serializable
data class BaixaResponse(
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
    val criadoEm: Long,
    val observacao: String? = null,
)

@Serializable
data class TituloReceberResponse(
    val id: Long,
    val idFilial: Long,
    val filialNome: String,
    val idCliente: Long,
    val clienteNome: String,
    val origem: OrigemTitulo,
    val idVenda: Long? = null,
    val moeda: Moeda,
    val valor: Double,
    val valorPyg: Double,
    val idCotacao: Long,
    val usdPyg: Double,
    val brlPyg: Double,
    val observacao: String? = null,
    val criadoEm: Long,
    val status: StatusTitulo,
    val parcelas: List<ParcelaResponse> = emptyList(),
    val baixas: List<BaixaResponse> = emptyList(),
)

@Serializable
data class TituloPagarResponse(
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
    val observacao: String? = null,
    val criadoEm: Long,
    val status: StatusTitulo,
    val parcelas: List<ParcelaResponse> = emptyList(),
    val baixas: List<BaixaResponse> = emptyList(),
)

@Serializable
data class TituloReceberResumoResponse(
    val id: Long,
    val idFilial: Long,
    val idCliente: Long,
    val clienteNome: String,
    val origem: OrigemTitulo,
    val idVenda: Long? = null,
    val moeda: Moeda,
    val valor: Double,
    val valorPyg: Double,
    val saldoPyg: Double,
    val criadoEm: Long,
    val status: StatusTitulo,
    val proximoVencimento: String? = null,
)

@Serializable
data class TituloPagarResumoResponse(
    val id: Long,
    val idFilial: Long,
    val idFornecedor: Long,
    val fornecedorNome: String,
    val origem: OrigemTitulo,
    val moeda: Moeda,
    val valor: Double,
    val valorPyg: Double,
    val saldoPyg: Double,
    val criadoEm: Long,
    val status: StatusTitulo,
    val proximoVencimento: String? = null,
)
