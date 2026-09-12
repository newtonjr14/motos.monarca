package com.monarca.produto.dto

import com.monarca.common.enums.Status
import com.monarca.pessoa.dto.FilialVinculoResponse
import com.monarca.produto.domain.Moeda
import com.monarca.produto.domain.SituacaoUnidade
import com.monarca.produto.domain.TipoProduto
import kotlinx.serialization.Serializable

@Serializable
data class ProdutoMotoRequest(
    val cor: String? = null,
    val potenciaMotorW: Int? = null,
    val autonomiaKm: Int? = null,
    val velocidadeMaxKmh: Int? = null,
    val capacidadeBateriaAh: Double? = null,
    val voltagemBateria: Int? = null,
    val tempoCargaHoras: Double? = null,
    val pesoKg: Double? = null,
    val capacidadeCargaKg: Int? = null,
    val assentos: Int? = null,
    val tipoFreio: String? = null,
    val anoFabricacao: Int,
    val anoModelo: Int,
)

@Serializable
data class ProdutoBicicletaRequest(
    val cor: String? = null,
    val potenciaMotorW: Int? = null,
    val autonomiaKm: Int? = null,
    val capacidadeBateriaAh: Double? = null,
    val voltagemBateria: Int? = null,
    val tempoCargaHoras: Double? = null,
    val pesoKg: Double? = null,
    val aro: String? = null,
    val tipoQuadro: String? = null,
    val numeroMarchas: Int? = null,
    val tipoFreio: String? = null,
    val numeroSerieQuadro: String? = null,
)

@Serializable
data class ProdutoRequest(
    val codigo: String = "",
    val nome: String? = null,
    val idMarca: Long,
    val idModelo: Long,
    val descricao: String? = null,
    val tipo: TipoProduto,
    val controlaChassi: Boolean? = null,
    val idFilialCadastro: Long? = null,
    val confirmarVinculoFilial: Boolean = false,
    val aliquotaIva: Int = 10,
    val moedaPreco: Moeda = Moeda.USD,
    val precoLista: Double = 0.0,
    val custo: Double = 0.0,
    val status: Status = Status.ATIVO,
    val moto: ProdutoMotoRequest? = null,
    val bicicleta: ProdutoBicicletaRequest? = null,
    val quantidadeInicial: Int = 0,
    val numerosIniciais: List<String> = emptyList(),
)

@Serializable
data class ProdutoStatusRequest(
    val status: Status,
)

@Serializable
data class ProdutoUnidadeResponse(
    val id: Long,
    val idProduto: Long,
    val idEstoque: Long,
    val estoqueNome: String,
    val numero: String,
    val situacao: SituacaoUnidade,
    val idVendaItem: Long? = null,
)

@Serializable
data class ProdutoUnidadeLoteRequest(
    val numeros: List<String> = emptyList(),
    val idEstoque: Long? = null,
)

@Serializable
data class ProdutoMotoResponse(
    val cor: String? = null,
    val potenciaMotorW: Int? = null,
    val autonomiaKm: Int? = null,
    val velocidadeMaxKmh: Int? = null,
    val capacidadeBateriaAh: Double? = null,
    val voltagemBateria: Int? = null,
    val tempoCargaHoras: Double? = null,
    val pesoKg: Double? = null,
    val capacidadeCargaKg: Int? = null,
    val assentos: Int? = null,
    val tipoFreio: String? = null,
    val anoFabricacao: Int,
    val anoModelo: Int,
)

@Serializable
data class ProdutoBicicletaResponse(
    val cor: String? = null,
    val potenciaMotorW: Int? = null,
    val autonomiaKm: Int? = null,
    val capacidadeBateriaAh: Double? = null,
    val voltagemBateria: Int? = null,
    val tempoCargaHoras: Double? = null,
    val pesoKg: Double? = null,
    val aro: String? = null,
    val tipoQuadro: String? = null,
    val numeroMarchas: Int? = null,
    val tipoFreio: String? = null,
    val numeroSerieQuadro: String? = null,
)

@Serializable
data class ProdutoResumoResponse(
    val id: Long,
    val codigo: String,
    val nome: String,
    val tipo: TipoProduto,
)

@Serializable
data class ProdutoEstoqueSaldoResponse(
    val idEstoque: Long,
    val estoqueNome: String,
    val quantidade: Int,
    val quantidadeReservada: Int,
    val quantidadeDisponivel: Int,
    val padrao: Boolean = false,
)

@Serializable
data class ProdutoResponse(
    val id: Long,
    val codigo: String,
    val nome: String,
    val idMarca: Long,
    val marca: String,
    val idModelo: Long,
    val modelo: String,
    val descricao: String? = null,
    val tipo: TipoProduto,
    val controlaChassi: Boolean,
    val idFilialCadastro: Long? = null,
    val filialNome: String? = null,
    val filiaisVinculadas: List<FilialVinculoResponse> = emptyList(),
    val aliquotaIva: Int,
    val moedaPreco: Moeda,
    val precoLista: Double,
    val custo: Double,
    val status: Status,
    val moto: ProdutoMotoResponse? = null,
    val bicicleta: ProdutoBicicletaResponse? = null,
    val quantidade: Int = 0,
    val quantidadeReservada: Int = 0,
    val quantidadeDisponivel: Int = 0,
    val estoques: List<ProdutoEstoqueSaldoResponse> = emptyList(),
)

@Serializable
data class VinculoFilialProdutoConflitoResponse(
    val codigo: String,
    val message: String,
    val idProduto: Long,
    val produto: ProdutoResumoResponse,
    val filiaisVinculadas: List<FilialVinculoResponse>,
    val idFilialAlvo: Long,
    val filialAlvoNome: String,
)
