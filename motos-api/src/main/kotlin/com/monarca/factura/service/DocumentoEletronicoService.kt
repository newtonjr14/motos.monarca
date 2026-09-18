package com.monarca.factura.service

import com.monarca.caixa.service.CaixaService
import com.monarca.empresa.service.EmpresaService
import com.monarca.factura.dto.DocumentoEletronicoPreviewResponse
import com.monarca.factura.dto.SudtaxDocumentoDados
import com.monarca.factura.dto.SudtaxDocumentoRequest
import com.monarca.factura.dto.SudtaxItem
import com.monarca.factura.dto.SudtaxReceptor
import com.monarca.localidade.service.RecursoNaoEncontrado
import com.monarca.localidade.service.acesso
import com.monarca.pessoa.dto.PapelResponse
import com.monarca.pessoa.service.PapelService
import com.monarca.usuario.repository.UsuarioRepository
import com.monarca.venda.domain.StatusVenda
import com.monarca.venda.repository.VendaRepository
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.encodeToJsonElement
import kotlinx.serialization.json.jsonObject
import kotlin.math.roundToLong

/**
 * Monta o payload do contrato SudTax 2026-09-17 a partir da venda.
 * Não chama a SudTax — só valida e monta JSON.
 */
class DocumentoEletronicoService(
    private val vendaRepository: VendaRepository,
    private val empresaService: EmpresaService,
    private val papelService: PapelService,
    private val caixaService: CaixaService,
    private val usuarioRepository: UsuarioRepository,
) {
    private val json = Json { encodeDefaults = true; prettyPrint = false }

    suspend fun montarDaVenda(idVenda: Long, idUsuario: Long): DocumentoEletronicoPreviewResponse {
        val venda = vendaRepository.buscar(idVenda)
            ?: throw RecursoNaoEncontrado("Venda $idVenda não encontrada")
        if (!usuarioRepository.temAcessoFilial(idUsuario, venda.idFilial)) {
            throw acesso("SEM_ACESSO_FILIAL", "Sem acesso à filial da venda")
        }
        if (venda.status != StatusVenda.FINALIZADA.name.lowercase()) {
            return DocumentoEletronicoPreviewResponse(
                idVenda = venda.id,
                pronto = false,
                avisos = listOf("Só é possível facturar venda finalizada"),
            )
        }

        val filial = empresaService.buscarFilial(venda.idFilial)
        val cliente = papelService.buscarCliente(venda.idCliente)
        val avisos = mutableListOf<String>()

        val est = pad3(filial.estabelecimentoNumero) ?: "001"
        val punto = pad3(filial.pontoExpedicao) ?: "001"
        if (filial.estabelecimentoNumero.isNullOrBlank()) {
            avisos += "Filial sem número de establecimiento (usando 001)"
        }
        if (filial.pontoExpedicao.isNullOrBlank()) {
            avisos += "Filial sem punto de expedición (usando 001)"
        }

        val ruc = resolverRucReceptor(cliente)
        if (ruc == null) {
            avisos += "Cliente sem RUC (obrigatório no contrato SudTax)"
        }

        val finais = caixaService.listarFinalizadores().associateBy { it.id }
        val temCredito = venda.negociacao.any { finais[it.idFinalizador]?.geraContasReceber == true }
        val condicion = if (temCredito) "credito" else "contado"

        val itens = venda.itens.map { item ->
            SudtaxItem(
                codigo = item.produtoCodigo.ifBlank { "P-${item.idProduto}" },
                descripcion = item.produtoNome.ifBlank { item.produtoCodigo }.ifBlank { "Item" },
                cantidad = item.quantidade,
                precioUnitario = item.precoUnitarioPyg.roundToLong(),
                iva = normalizarIva(item.aliquotaIva),
            )
        }
        if (itens.isEmpty()) avisos += "Venda sem itens"

        val pronto = ruc != null && itens.isNotEmpty()
        if (!pronto || ruc == null) {
            return DocumentoEletronicoPreviewResponse(
                idVenda = venda.id,
                pronto = false,
                avisos = avisos.distinct(),
            )
        }

        val documento = SudtaxDocumentoRequest(
            tipo = "factura",
            referencia = "venda-${venda.id}",
            estabelecimento = est,
            pontoExpedicao = punto,
            dados = SudtaxDocumentoDados(
                tipoOperacion = "mercaderia",
                condicion = condicion,
                receptor = SudtaxReceptor(ruc = ruc, nome = venda.clienteNome),
                itens = itens,
            ),
        )
        return DocumentoEletronicoPreviewResponse(
            idVenda = venda.id,
            pronto = true,
            avisos = avisos.distinct().filter { !it.contains("usando 001") },
            documento = documento,
            payload = json.encodeToJsonElement(documento).jsonObject,
        )
    }

    private fun resolverRucReceptor(cliente: PapelResponse): String? {
        val docs = cliente.pessoa.documentos
        val ruc = docs.firstOrNull { it.tipoCodigo.equals("RUC", ignoreCase = true) } ?: return null
        return ruc.numero.trim().takeIf { it.isNotEmpty() }
    }

    private fun normalizarIva(aliquota: Int): Int = when (aliquota) {
        10, 5, 0 -> aliquota
        else -> 10
    }

    private fun pad3(valor: String?): String? {
        val d = valor?.trim()?.filter { it.isDigit() }.orEmpty()
        if (d.isEmpty()) return null
        return d.takeLast(3).padStart(3, '0')
    }
}
