package com.monarca.factura.service

import com.monarca.cotacao.service.CotacaoService
import com.monarca.factura.domain.EstadoFactura
import com.monarca.factura.dto.FacturaEmitirRequest
import com.monarca.factura.dto.FacturaResponse
import com.monarca.factura.dto.FacturaResumoResponse
import com.monarca.factura.dto.SudtaxDocumentoResponse
import com.monarca.factura.dto.VendaElegivelFacturaResponse
import com.monarca.factura.repository.FacturaAtualizacaoSudtax
import com.monarca.factura.repository.FacturaNova
import com.monarca.factura.repository.FacturaRegistro
import com.monarca.factura.repository.FacturaRepository
import com.monarca.factura.sudtax.SudtaxClient
import com.monarca.localidade.service.RecursoNaoEncontrado
import com.monarca.localidade.service.acesso
import com.monarca.localidade.service.invalido
import com.monarca.usuario.repository.UsuarioRepository
import com.monarca.venda.domain.StatusVenda
import com.monarca.venda.repository.VendaRepository
import com.monarca.empresa.service.EmpresaService
import kotlinx.serialization.json.Json

class FacturaService(
    private val repository: FacturaRepository,
    private val documentoEletronico: DocumentoEletronicoService,
    private val sudtaxClient: SudtaxClient,
    private val cotacaoService: CotacaoService,
    private val vendaRepository: VendaRepository,
    private val usuarioRepository: UsuarioRepository,
    private val empresaService: EmpresaService,
) {
    private val json = Json { encodeDefaults = true; prettyPrint = false }

    suspend fun listar(idFilial: Long?, idUsuario: Long): List<FacturaResumoResponse> {
        val filial = resolverFilial(idUsuario, idFilial)
        return repository.listar(filial).map { it.toResumo() }
    }

    suspend fun buscar(id: Long, idUsuario: Long): FacturaResponse {
        val factura = repository.buscar(id)
            ?: throw RecursoNaoEncontrado("Factura $id não encontrada")
        exigirAcessoFilial(idUsuario, factura.idFilial)
        return factura.toResponse()
    }

    suspend fun buscarPorVenda(idVenda: Long, idUsuario: Long): FacturaResponse? {
        val factura = repository.buscarPorVenda(idVenda) ?: return null
        exigirAcessoFilial(idUsuario, factura.idFilial)
        return factura.toResponse()
    }

    suspend fun listarVendasElegiveis(idFilial: Long?, idUsuario: Long): List<VendaElegivelFacturaResponse> {
        val filial = resolverFilial(idUsuario, idFilial)
        val facturadas = repository.listar(filial).map { it.idVenda }.toSet()
        return vendaRepository.listar(filial)
            .filter { it.status == StatusVenda.FINALIZADA.name.lowercase() && it.id !in facturadas }
            .map {
                VendaElegivelFacturaResponse(
                    id = it.id,
                    clienteNome = it.clienteNome,
                    totalPyg = it.totalPyg,
                    criadoEm = it.criadoEm,
                )
            }
    }

    suspend fun emitir(request: FacturaEmitirRequest, idUsuario: Long): FacturaResponse {
        cotacaoService.exigirAtiva()
        sudtaxClient.exigirHabilitado()

        val existente = repository.buscarPorVenda(request.idVenda)
        if (existente != null) {
            return existente.toResponse()
        }

        val preview = documentoEletronico.montarDaVenda(request.idVenda, idUsuario)
        if (!preview.pronto || preview.documento == null) {
            throw invalido(
                "FACTURA_NAO_PRONTA",
                preview.avisos.joinToString("; ").ifBlank { "Venda não está pronta para facturar" },
                "avisos" to preview.avisos,
            )
        }

        val venda = vendaRepository.buscar(request.idVenda)
            ?: throw RecursoNaoEncontrado("Venda ${request.idVenda} não encontrada")
        exigirAcessoFilial(idUsuario, venda.idFilial)

        val documento = preview.documento
        val payloadJson = json.encodeToString(documento)

        val sudtax = try {
            sudtaxClient.criarDocumento(documento)
        } catch (e: Exception) {
            if (e is com.monarca.localidade.service.RequisicaoInvalida &&
                e.codigo == "DOCUMENTO_REFERENCIA_DUPLICADA"
            ) {
                val local = repository.buscarPorReferencia(documento.referencia)
                if (local != null) return local.toResponse()
                throw invalido(
                    "DOCUMENTO_REFERENCIA_DUPLICADA",
                    "Já existe documento na SudTax com referência ${documento.referencia}. " +
                        "Não há registro local — confira o painel SudTax.",
                )
            }
            throw e
        }

        val id = repository.inserir(
            FacturaNova(
                idFilial = venda.idFilial,
                idVenda = venda.id,
                referencia = documento.referencia,
                sudtaxId = sudtax.id,
                cdc = sudtax.cdc,
                cdcFormatado = sudtax.cdcFormatado,
                estado = normalizarEstado(sudtax.estado),
                mensagem = sudtax.mensaje,
                protocoloLote = sudtax.protocoloLote,
                codigoSifen = sudtax.codigoSifen,
                estabelecimento = documento.estabelecimento,
                pontoExpedicao = documento.pontoExpedicao,
                clienteNome = venda.clienteNome,
                totalPyg = venda.totalPyg,
                payloadEnvio = payloadJson,
            ),
        )

        var factura = repository.buscar(id)
            ?: throw RecursoNaoEncontrado("Factura $id não encontrada após criar")

        if (request.enviar && factura.sudtaxId != null &&
            factura.estado == EstadoFactura.PENDENTE.name.lowercase()
        ) {
            factura = enviarInterno(factura)
        }

        return factura.toResponse()
    }

    suspend fun enviar(id: Long, idUsuario: Long): FacturaResponse {
        cotacaoService.exigirAtiva()
        val factura = repository.buscar(id)
            ?: throw RecursoNaoEncontrado("Factura $id não encontrada")
        exigirAcessoFilial(idUsuario, factura.idFilial)
        return enviarInterno(factura).toResponse()
    }

    suspend fun consultar(id: Long, idUsuario: Long): FacturaResponse {
        val factura = repository.buscar(id)
            ?: throw RecursoNaoEncontrado("Factura $id não encontrada")
        exigirAcessoFilial(idUsuario, factura.idFilial)
        val sudtaxId = factura.sudtaxId
            ?: throw invalido("FACTURA_SEM_SUDTAX", "Factura sem id SudTax")

        val resp = try {
            sudtaxClient.consultar(sudtaxId)
        } catch (_: Exception) {
            sudtaxClient.buscar(sudtaxId)
        }
        aplicarResposta(factura.id, resp)
        return repository.buscar(factura.id)!!.toResponse()
    }

    private suspend fun enviarInterno(factura: FacturaRegistro): FacturaRegistro {
        val sudtaxId = factura.sudtaxId
            ?: throw invalido("FACTURA_SEM_SUDTAX", "Factura sem id SudTax")
        if (factura.estado == EstadoFactura.APROBADO.name.lowercase()) {
            return factura
        }
        if (factura.estado == EstadoFactura.CANCELADO.name.lowercase()) {
            throw invalido("FACTURA_CANCELADA", "Factura cancelada não pode ser enviada")
        }

        val resp = sudtaxClient.enviar(sudtaxId)
        aplicarResposta(factura.id, resp)
        return repository.buscar(factura.id)!!
    }

    private suspend fun aplicarResposta(id: Long, resp: SudtaxDocumentoResponse) {
        repository.atualizarSudtax(
            id,
            FacturaAtualizacaoSudtax(
                sudtaxId = resp.id,
                cdc = resp.cdc,
                cdcFormatado = resp.cdcFormatado,
                estado = normalizarEstado(resp.estado),
                mensagem = resp.mensaje,
                protocoloLote = resp.protocoloLote,
                codigoSifen = resp.codigoSifen,
            ),
        )
    }

    private fun normalizarEstado(raw: String?): String {
        val v = raw?.trim()?.lowercase().orEmpty()
        return when (v) {
            "pendente", "pendiente" -> EstadoFactura.PENDENTE.name.lowercase()
            "processando", "procesando", "processando_lote" -> EstadoFactura.PROCESSANDO.name.lowercase()
            "aprobado", "aprovado", "approved" -> EstadoFactura.APROBADO.name.lowercase()
            "rechazado", "rejeitado", "rejected" -> EstadoFactura.RECHAZADO.name.lowercase()
            "cancelado", "cancelled" -> EstadoFactura.CANCELADO.name.lowercase()
            else -> v.ifBlank { EstadoFactura.PENDENTE.name.lowercase() }
        }
    }

    private suspend fun resolverFilial(idUsuario: Long, idFilial: Long?): Long {
        val resolvida = empresaService.resolverFilialCadastro(idFilial)
        exigirAcessoFilial(idUsuario, resolvida)
        return resolvida
    }

    private suspend fun exigirAcessoFilial(idUsuario: Long, idFilial: Long) {
        if (!usuarioRepository.temAcessoFilial(idUsuario, idFilial)) {
            throw acesso("SEM_ACESSO_FILIAL", "Sem acesso à filial")
        }
    }

    private fun FacturaRegistro.toResumo() = FacturaResumoResponse(
        id = id,
        idFilial = idFilial,
        idVenda = idVenda,
        referencia = referencia,
        sudtaxId = sudtaxId,
        cdc = cdc,
        cdcFormatado = cdcFormatado,
        estado = estado,
        mensagem = mensagem,
        protocoloLote = protocoloLote,
        codigoSifen = codigoSifen,
        estabelecimento = estabelecimento,
        pontoExpedicao = pontoExpedicao,
        clienteNome = clienteNome,
        totalPyg = totalPyg,
        criadoEm = criadoEm,
        atualizadoEm = atualizadoEm,
    )

    private fun FacturaRegistro.toResponse() = FacturaResponse(
        id = id,
        idFilial = idFilial,
        idVenda = idVenda,
        referencia = referencia,
        sudtaxId = sudtaxId,
        cdc = cdc,
        cdcFormatado = cdcFormatado,
        estado = estado,
        mensagem = mensagem,
        protocoloLote = protocoloLote,
        codigoSifen = codigoSifen,
        estabelecimento = estabelecimento,
        pontoExpedicao = pontoExpedicao,
        clienteNome = clienteNome,
        totalPyg = totalPyg,
        payloadEnvio = payloadEnvio,
        criadoEm = criadoEm,
        atualizadoEm = atualizadoEm,
    )
}
