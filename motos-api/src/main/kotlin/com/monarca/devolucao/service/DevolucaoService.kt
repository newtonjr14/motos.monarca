package com.monarca.devolucao.service

import com.monarca.caixa.service.CaixaService
import com.monarca.common.enums.Status
import com.monarca.devolucao.dto.ChassisDevolucaoResponse
import com.monarca.devolucao.dto.CreditoClienteResponse
import com.monarca.devolucao.dto.DevolucaoItemDisponivelResponse
import com.monarca.devolucao.dto.DevolucaoItemResponse
import com.monarca.devolucao.dto.DevolucaoPreviewResponse
import com.monarca.devolucao.dto.DevolucaoRequest
import com.monarca.devolucao.dto.DevolucaoResponse
import com.monarca.devolucao.repository.DevolucaoItemNova
import com.monarca.devolucao.repository.DevolucaoLista
import com.monarca.devolucao.repository.DevolucaoNova
import com.monarca.devolucao.repository.DevolucaoRepository
import com.monarca.devolucao.repository.ItemDevolucaoDisponivel
import com.monarca.empresa.service.EmpresaService
import com.monarca.localidade.service.RecursoNaoEncontrado
import com.monarca.localidade.service.acesso
import com.monarca.localidade.service.invalido
import com.monarca.produto.domain.Moeda
import com.monarca.usuario.repository.UsuarioRepository
import com.monarca.venda.domain.StatusVenda
import kotlin.math.round

class DevolucaoService(
    private val repository: DevolucaoRepository,
    private val caixaService: CaixaService,
    private val empresaService: EmpresaService,
    private val usuarioRepository: UsuarioRepository,
) {
    suspend fun listar(idFilial: Long?, idUsuario: Long): List<DevolucaoResponse> {
        val filial = resolverFilial(idUsuario, idFilial)
        return repository.listar(filial).map { it.toResponse() }
    }

    suspend fun buscar(id: Long, idUsuario: Long): DevolucaoResponse {
        val item = repository.buscar(id) ?: throw RecursoNaoEncontrado("Devolução $id não encontrada")
        val venda = repository.vendaParaDevolucao(item.idVenda)
            ?: throw RecursoNaoEncontrado("Venda ${item.idVenda} não encontrada")
        exigirAcessoFilial(idUsuario, venda.idFilial)
        return item.toResponse()
    }

    suspend fun preview(idVenda: Long, idUsuario: Long): DevolucaoPreviewResponse {
        val venda = repository.vendaParaDevolucao(idVenda)
            ?: throw RecursoNaoEncontrado("Venda $idVenda não encontrada")
        exigirAcessoFilial(idUsuario, venda.idFilial)
        if (venda.status != StatusVenda.FINALIZADA.name.lowercase()) {
            throw invalido("DEVOLUCAO_VENDA", "Só uma venda finalizada pode ser devolvida")
        }
        return venda.toPreview()
    }

    suspend fun saldoCredito(idFilial: Long?, idCliente: Long, idUsuario: Long): CreditoClienteResponse {
        val filial = resolverFilial(idUsuario, idFilial)
        return CreditoClienteResponse(saldoPyg = round(repository.saldoCredito(filial, idCliente)))
    }

    suspend fun criar(request: DevolucaoRequest, idUsuario: Long): DevolucaoResponse {
        val filial = resolverFilial(idUsuario, request.idFilial)
        val venda = repository.vendaParaDevolucao(request.idVenda)
            ?: throw RecursoNaoEncontrado("Venda ${request.idVenda} não encontrada")
        if (venda.idFilial != filial) {
            throw invalido("DEVOLUCAO_FILIAL", "A venda não é desta filial")
        }
        if (venda.status != StatusVenda.FINALIZADA.name.lowercase()) {
            throw invalido("DEVOLUCAO_VENDA", "Só uma venda finalizada pode ser devolvida")
        }
        val porItem = venda.itens.associateBy { it.idVendaItem }
        val linhas = mutableListOf<DevolucaoItemNova>()
        for (pedido in request.itens) {
            val item = porItem[pedido.idVendaItem]
                ?: throw invalido("DEVOLUCAO_ITEM", "O item não pertence a esta venda")
            val disponivel = item.quantidadeVendida - item.quantidadeDevolvida
            val qtd = if (item.controlaChassi) pedido.idsUnidades.distinct().size else pedido.quantidade
            if (qtd <= 0) continue
            if (qtd > disponivel) {
                throw invalido("DEVOLUCAO_QTD", "A quantidade devolve mais do que ainda está na venda")
            }
            if (item.controlaChassi) {
                val livres = item.chassis.map { it.id }.toSet()
                if (pedido.idsUnidades.distinct().any { it !in livres }) {
                    throw invalido("DEVOLUCAO_CHASSI", "Um chassi desta devolução já não está vendido")
                }
            }
            val valor = valorLinha(item, qtd)
            linhas += DevolucaoItemNova(
                idVendaItem = item.idVendaItem,
                idProduto = item.idProduto,
                idEstoque = item.idEstoque,
                quantidade = qtd,
                valorPyg = valor,
                idsUnidades = if (item.controlaChassi) pedido.idsUnidades.distinct() else emptyList(),
            )
        }
        if (linhas.isEmpty()) {
            throw invalido("DEVOLUCAO_ITENS", "Informe ao menos um item para devolver")
        }
        val valorPyg = linhas.sumOf { it.valorPyg }
        val abatido = minOf(valorPyg, venda.abertoPyg)
        val excesso = (valorPyg - abatido).coerceAtLeast(0.0)
        val tratamento = if (excesso <= 1.0) {
            "abater"
        } else {
            when (request.tratamento) {
                "credito", "ignorar", "caixa" -> request.tratamento
                else -> throw invalido("DEVOLUCAO_TRATAMENTO", "Escolha crédito, ignorar ou sair do caixa")
            }
        }
        var idFinalizador: Long? = null
        var moedaCaixa: String? = null
        var valorCaixa: Double? = null
        var idSessao: Long? = null
        if (tratamento == "caixa") {
            val idFin = request.idFinalizador
                ?: throw invalido("FINALIZADOR_OBRIGATORIO", "Escolha a forma que sai do caixa")
            val fin = caixaService.buscarFinalizador(idFin)
            if (fin.status != Status.ATIVO || fin.geraContasReceber || fin.geraContasPagar || fin.geraCreditoCliente) {
                throw invalido("DEVOLUCAO_CAIXA", "A saída do caixa usa uma forma que entra no caixa")
            }
            val moeda = request.moedaCaixa ?: Moeda.PYG
            val valor = dePyg(excesso, moeda, venda.usdPyg, venda.brlPyg)
            val sessao = caixaService.resolverSessaoVenda(idUsuario, filial, request.idCaixaSessao)
            val saldo = sessao.saldos.firstOrNull { it.idFinalizador == idFin && it.moeda == moeda }?.valor ?: 0.0
            if (valor > saldo + 0.009) {
                throw invalido("CAIXA_SALDO_INSUFICIENTE", "O caixa não tem saldo nesta forma e moeda")
            }
            idFinalizador = idFin
            moedaCaixa = moeda.name.lowercase()
            valorCaixa = valor
            idSessao = sessao.sessao.id
        }
        val id = repository.inserir(
            DevolucaoNova(
                idFilial = filial,
                idVenda = venda.id,
                idCliente = venda.idCliente,
                valorPyg = round(valorPyg),
                abatidoPyg = round(abatido),
                excessoPyg = round(excesso),
                tratamento = tratamento,
                idFinalizador = idFinalizador,
                moedaCaixa = moedaCaixa,
                valorCaixa = valorCaixa,
                idCaixaSessao = idSessao,
                idCotacao = venda.idCotacao,
                usdPyg = venda.usdPyg,
                brlPyg = venda.brlPyg,
                observacao = request.observacao?.trim()?.ifBlank { null },
                idUsuario = idUsuario,
                itens = linhas,
            ),
        )
        return buscar(id, idUsuario)
    }

    private fun valorLinha(item: ItemDevolucaoDisponivel, qtd: Int): Double {
        val vendida = item.quantidadeVendida
        if (vendida <= 0) return 0.0
        val ja = round(item.totalPyg * item.quantidadeDevolvida / vendida)
        return if (item.quantidadeDevolvida + qtd >= vendida) {
            (item.totalPyg - ja).coerceAtLeast(0.0)
        } else {
            round(item.totalPyg * qtd / vendida)
        }
    }

    private fun dePyg(pyg: Double, moeda: Moeda, usdPyg: Double, brlPyg: Double): Double = when (moeda) {
        Moeda.PYG -> round(pyg)
        Moeda.USD -> {
            if (usdPyg <= 0.0) throw invalido("COTACAO_AUSENTE", "A cotação da venda não tem dólar")
            round(pyg / usdPyg * 100.0) / 100.0
        }
        Moeda.BRL -> {
            if (brlPyg <= 0.0) throw invalido("COTACAO_AUSENTE", "A cotação da venda não tem real")
            round(pyg / brlPyg * 100.0) / 100.0
        }
    }

    private suspend fun resolverFilial(idUsuario: Long, idFilial: Long?): Long {
        val resolvida = empresaService.resolverFilialCadastro(idFilial)
        exigirAcessoFilial(idUsuario, resolvida)
        return resolvida
    }

    private suspend fun exigirAcessoFilial(idUsuario: Long, idFilial: Long) {
        if (!usuarioRepository.temAcessoFilial(idUsuario, idFilial)) {
            throw acesso("SEM_ACESSO_FILIAL", "Sem acesso a esta filial")
        }
    }

    private fun com.monarca.devolucao.repository.VendaParaDevolucao.toPreview() = DevolucaoPreviewResponse(
        idVenda = id,
        idCliente = idCliente,
        clienteNome = clienteNome,
        totalPyg = totalPyg,
        abertoPyg = abertoPyg,
        usdPyg = usdPyg,
        brlPyg = brlPyg,
        itens = itens.map { item ->
            DevolucaoItemDisponivelResponse(
                idVendaItem = item.idVendaItem,
                produtoCodigo = item.produtoCodigo,
                produtoNome = item.produtoNome,
                controlaChassi = item.controlaChassi,
                quantidadeVendida = item.quantidadeVendida,
                quantidadeDevolvida = item.quantidadeDevolvida,
                quantidadeDisponivel = item.quantidadeVendida - item.quantidadeDevolvida,
                totalPyg = item.totalPyg,
                chassis = item.chassis.map { ChassisDevolucaoResponse(it.id, it.numero) },
            )
        },
    )

    private fun DevolucaoLista.toResponse() = DevolucaoResponse(
        id = id,
        idVenda = idVenda,
        clienteNome = clienteNome,
        valorPyg = valorPyg,
        abatidoPyg = abatidoPyg,
        excessoPyg = excessoPyg,
        tratamento = tratamento,
        criadoEm = criadoEm,
        itens = itens.map {
            DevolucaoItemResponse(
                id = it.id,
                produtoCodigo = it.produtoCodigo,
                produtoNome = it.produtoNome,
                quantidade = it.quantidade,
                valorPyg = it.valorPyg,
                chassis = it.chassis,
            )
        },
    )
}
