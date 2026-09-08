package com.monarca.caixa.dto

import com.monarca.caixa.domain.StatusSessaoCaixa
import com.monarca.caixa.domain.TipoFinalizador
import com.monarca.caixa.domain.TipoMovimentacaoCaixa
import com.monarca.common.enums.Status
import kotlinx.serialization.Serializable

@Serializable
data class FinalizadorRequest(
    val nome: String,
    val tipo: TipoFinalizador,
    val status: Status = Status.ATIVO,
)

@Serializable
data class FinalizadorResponse(
    val id: Long,
    val nome: String,
    val tipo: TipoFinalizador,
    val status: Status,
)

@Serializable
data class CaixaRequest(
    val idFilial: Long? = null,
    val nome: String,
    val status: Status = Status.ATIVO,
)

@Serializable
data class CaixaResponse(
    val id: Long,
    val idFilial: Long,
    val filialNome: String,
    val nome: String,
    val status: Status,
    val sessaoAbertaId: Long? = null,
    val padrao: Boolean = false,
)

@Serializable
data class CaixaAcessoResponse(
    val id: Long,
    val nome: String,
    val idFilial: Long,
    val filialNome: String,
    val padrao: Boolean,
)

@Serializable
data class ValorFinalizadorRequest(
    val idFinalizador: Long,
    val valor: Double,
)

@Serializable
data class ValorFinalizadorResponse(
    val idFinalizador: Long,
    val finalizadorNome: String? = null,
    val valor: Double,
)

@Serializable
data class AbrirSessaoRequest(
    val idCaixa: Long,
    val conferencia: List<ValorFinalizadorRequest> = emptyList(),
    val observacao: String? = null,
)

@Serializable
data class FecharSessaoRequest(
    val conferencia: List<ValorFinalizadorRequest>,
    val observacao: String? = null,
)

@Serializable
data class TransferenciaCaixaRequest(
    val idCaixaDestino: Long,
    val conferencia: List<ValorFinalizadorRequest>,
    val observacao: String? = null,
)

@Serializable
data class CaixaSessaoResponse(
    val id: Long,
    val idCaixa: Long,
    val caixaNome: String,
    val idFilial: Long,
    val data: String,
    val abertoEm: Long,
    val fechadoEm: Long?,
    val idUsuarioAbertura: Long,
    val usuarioAberturaNome: String,
    val idUsuarioFechamento: Long? = null,
    val observacaoAbertura: String? = null,
    val observacaoFechamento: String? = null,
    val status: StatusSessaoCaixa,
    val saldos: List<ValorFinalizadorResponse> = emptyList(),
)

@Serializable
data class CaixaMovimentacaoResponse(
    val id: Long,
    val idCaixaSessao: Long,
    val tipo: TipoMovimentacaoCaixa,
    val idUsuario: Long,
    val usuarioNome: String,
    val idVenda: Long? = null,
    val criadoEm: Long,
    val observacao: String? = null,
    val finalizadores: List<ValorFinalizadorResponse>,
)
