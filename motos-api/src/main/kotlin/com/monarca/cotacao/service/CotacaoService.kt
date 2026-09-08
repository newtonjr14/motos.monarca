package com.monarca.cotacao.service

import com.monarca.common.enums.Status
import com.monarca.cotacao.domain.Cotacao
import com.monarca.cotacao.dto.CotacaoRequest
import com.monarca.cotacao.dto.CotacaoResponse
import com.monarca.cotacao.repository.CotacaoRepository
import com.monarca.localidade.service.RecursoNaoEncontrado
import com.monarca.localidade.service.acesso
import com.monarca.localidade.service.invalido
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeParseException

class CotacaoService(
    private val repository: CotacaoRepository,
    private val zona: ZoneId,
) {

    fun dataHoje(): String = LocalDate.now(zona).toString()

    suspend fun listar(): List<CotacaoResponse> = repository.listar().map { it.toResponse() }

    suspend fun buscar(id: Long): CotacaoResponse =
        repository.buscar(id)?.toResponse()
            ?: throw RecursoNaoEncontrado("Cotação $id não encontrada")

    suspend fun buscarHoje(): CotacaoResponse =
        repository.buscarPorData(dataHoje())
            ?.takeIf { it.status == Status.ATIVO }
            ?.toResponse()
            ?: throw RecursoNaoEncontrado("Cotação do dia não informada", "COTACAO_DIA_AUSENTE")

    suspend fun temHoje(): Boolean =
        repository.buscarPorData(dataHoje())?.status == Status.ATIVO

    suspend fun exigirAtiva() {
        if (!temHoje()) {
            throw acesso(
                "COTACAO_DIA_AUSENTE",
                "Informe a cotação do dia para vender, receber, pagar ou emitir factura",
            )
        }
    }

    suspend fun criar(request: CotacaoRequest): CotacaoResponse {
        val cotacao = validar(request, id = 0)
        val existente = repository.buscarPorData(cotacao.data)
        val id = when {
            existente == null -> repository.inserir(cotacao)
            existente.status == Status.DELETADO -> {
                repository.atualizar(existente.id, cotacao.copy(id = existente.id))
                existente.id
            }
            else -> throw invalido(
                "COTACAO_DIA_DUPLICADA",
                "Já existe cotação para ${cotacao.data}",
                "data" to cotacao.data,
            )
        }
        return buscar(id)
    }

    suspend fun atualizar(id: Long, request: CotacaoRequest): CotacaoResponse {
        val atual = repository.buscar(id) ?: throw RecursoNaoEncontrado("Cotação $id não encontrada")
        val cotacao = validar(request, id)
        if (cotacao.data != atual.data) {
            val outro = repository.buscarPorData(cotacao.data)
            if (outro != null && outro.id != id && outro.status != Status.DELETADO) {
                throw invalido(
                    "COTACAO_DIA_DUPLICADA",
                    "Já existe cotação para ${cotacao.data}",
                    "data" to cotacao.data,
                )
            }
        }
        repository.atualizar(id, cotacao)
        return buscar(id)
    }

    suspend fun excluir(id: Long) {
        if (!repository.excluir(id)) {
            throw RecursoNaoEncontrado("Cotação $id não encontrada")
        }
    }

    private fun validar(request: CotacaoRequest, id: Long): Cotacao {
        val data = validarData(request.data)
        if (request.usdPyg <= 0 || request.brlPyg <= 0) {
            throw invalido("COTACAO_TAXA_INVALIDA", "A taxa deve ser maior que zero")
        }
        if (request.status == Status.DELETADO) {
            throw invalido("USE_DELETE", "Use DELETE para marcar como deletado")
        }
        return Cotacao(
            id = id,
            data = data,
            usdPyg = request.usdPyg,
            brlPyg = request.brlPyg,
            status = request.status,
        )
    }

    private fun validarData(valor: String): String {
        val data = try {
            LocalDate.parse(valor.trim())
        } catch (_: DateTimeParseException) {
            throw invalido("COTACAO_DATA_INVALIDA", "Data inválida. Use AAAA-MM-DD")
        }
        if (data.isAfter(LocalDate.now(zona))) {
            throw invalido("COTACAO_DATA_FUTURA", "Não é possível informar cotação de data futura")
        }
        return data.toString()
    }

    private fun Cotacao.toResponse() = CotacaoResponse(
        id = id,
        data = data,
        usdPyg = usdPyg,
        brlPyg = brlPyg,
        status = status,
    )
}
