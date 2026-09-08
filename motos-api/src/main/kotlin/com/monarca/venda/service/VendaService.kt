package com.monarca.venda.service

import com.monarca.caixa.service.CaixaService
import com.monarca.common.enums.Status
import com.monarca.cotacao.dto.CotacaoResponse
import com.monarca.cotacao.service.CotacaoService
import com.monarca.empresa.service.EmpresaService
import com.monarca.localidade.service.RecursoNaoEncontrado
import com.monarca.localidade.service.acesso
import com.monarca.localidade.service.invalido
import com.monarca.pessoa.service.PapelService
import com.monarca.produto.domain.Moeda
import com.monarca.produto.repository.ProdutoRepository
import com.monarca.usuario.repository.UsuarioRepository
import com.monarca.venda.domain.StatusVenda
import com.monarca.venda.dto.VendaItemResponse
import com.monarca.venda.dto.VendaNegociacaoRequest
import com.monarca.venda.dto.VendaNegociacaoResponse
import com.monarca.venda.dto.VendaRequest
import com.monarca.venda.dto.VendaResponse
import com.monarca.venda.repository.VendaCompleta
import com.monarca.venda.repository.VendaItemPersistencia
import com.monarca.venda.repository.VendaNegociacaoPersistencia
import com.monarca.venda.repository.VendaRepository
import kotlin.math.abs
import kotlin.math.round

class VendaService(
    private val repository: VendaRepository,
    private val cotacaoService: CotacaoService,
    private val caixaService: CaixaService,
    private val empresaService: EmpresaService,
    private val usuarioRepository: UsuarioRepository,
    private val produtoRepository: ProdutoRepository,
    private val papelService: PapelService,
) {

    suspend fun listar(idFilial: Long?, idUsuario: Long): List<VendaResponse> {
        val filial = resolverFilialComAcesso(idUsuario, idFilial)
        return repository.listar(filial).map { it.toResponse() }
    }

    suspend fun buscar(id: Long, idUsuario: Long): VendaResponse {
        val venda = repository.buscar(id) ?: throw RecursoNaoEncontrado("Venda $id não encontrada")
        exigirAcessoFilial(idUsuario, venda.idFilial)
        return venda.toResponse()
    }

    suspend fun criar(request: VendaRequest, idUsuario: Long): VendaResponse {
        cotacaoService.exigirAtiva()
        val cotacao = cotacaoService.buscarHoje()
        val idFilial = resolverFilialComAcesso(idUsuario, request.idFilial)
        val sessao = caixaService.resolverSessaoVenda(idUsuario, idFilial, request.idCaixaSessao)
        val cliente = papelService.buscarCliente(request.idCliente)
        if (cliente.status != Status.ATIVO) {
            throw invalido("CLIENTE_INATIVO", "O cliente não está ativo")
        }
        val vinculado = cliente.idFilialCadastro == idFilial ||
            cliente.filiaisVinculadas.any { it.id == idFilial }
        if (!vinculado) {
            throw invalido("CLIENTE_FILIAL", "O cliente não pertence a esta filial")
        }
        if (request.itens.isEmpty()) {
            throw invalido("VENDA_ITENS_OBRIGATORIOS", "Informe ao menos um item")
        }
        val itens = montarItens(request, idFilial, cotacao)
        val totalPyg = itens.sumOf { it.totalPyg }
        if (totalPyg <= 0) {
            throw invalido("VENDA_TOTAL_INVALIDO", "O total da venda deve ser maior que zero")
        }
        val negociacao = montarNegociacao(request.negociacao, totalPyg)
        val id = repository.inserir(
            idFilial = idFilial,
            idCliente = request.idCliente,
            idVendedor = idUsuario,
            idCaixaSessao = sessao.sessao.id,
            idCotacao = cotacao.id,
            totalPyg = totalPyg,
            observacao = request.observacao?.trim()?.ifBlank { null },
            itens = itens,
            negociacao = negociacao,
            idUsuario = idUsuario,
        )
        return buscar(id, idUsuario)
    }

    private suspend fun montarItens(
        request: VendaRequest,
        idFilial: Long,
        cotacao: CotacaoResponse,
    ): List<VendaItemPersistencia> {
        val agrupado = linkedMapOf<Pair<Long, Long?>, Int>()
        for (item in request.itens) {
            if (item.quantidade <= 0) {
                throw invalido("VENDA_QTD_INVALIDA", "A quantidade deve ser maior que zero")
            }
            val chave = item.idProduto to item.idEstoque
            agrupado[chave] = (agrupado[chave] ?: 0) + item.quantidade
        }
        return agrupado.map { (chave, quantidade) ->
            val (idProduto, idEstoquePedido) = chave
            val completo = produtoRepository.buscar(idProduto)
                ?: throw RecursoNaoEncontrado("Produto $idProduto não encontrado")
            val produto = completo.produto
            if (produto.status != Status.ATIVO) {
                throw invalido("PRODUTO_INATIVO", "O produto ${produto.codigo} não está ativo")
            }
            if (produto.precoLista <= 0) {
                throw invalido("VENDA_PRECO_AUSENTE", "Informe o preço de lista do produto ${produto.codigo}")
            }
            val saldos = produtoRepository.listarEstoqueDoProduto(idProduto, idFilial)
            val escolhido = if (idEstoquePedido != null) {
                saldos.find { it.idEstoque == idEstoquePedido }
                    ?: throw invalido("ESTOQUE_FILIAL", "O estoque não pertence a esta filial")
            } else {
                saldos.filter { it.quantidadeDisponivel >= quantidade }
                    .maxByOrNull { it.quantidadeDisponivel }
                    ?: saldos.maxByOrNull { it.quantidadeDisponivel }
                    ?: throw invalido("ESTOQUE_INSUFICIENTE", "Sem estoque na filial para ${produto.codigo}")
            }
            if (escolhido.quantidadeDisponivel < quantidade) {
                throw invalido("ESTOQUE_INSUFICIENTE", "Saldo insuficiente para vender ${produto.codigo}")
            }
            val unitario = paraPyg(produto.precoLista, produto.moedaPreco, cotacao)
            VendaItemPersistencia(
                idProduto = idProduto,
                produtoCodigo = produto.codigo,
                produtoNome = produto.nome,
                idEstoque = escolhido.idEstoque,
                estoqueNome = escolhido.estoqueNome,
                quantidade = quantidade,
                aliquotaIva = produto.aliquotaIva,
                moedaPreco = produto.moedaPreco.name.lowercase(),
                precoLista = produto.precoLista,
                precoUnitarioPyg = unitario,
                totalPyg = unitario * quantidade,
            )
        }
    }

    private suspend fun montarNegociacao(
        linhas: List<VendaNegociacaoRequest>,
        totalPyg: Double,
    ): List<VendaNegociacaoPersistencia> {
        if (linhas.isEmpty()) {
            throw invalido("VENDA_NEGOCIACAO_OBRIGATORIA", "Informe ao menos uma forma de pagamento")
        }
        val agrupado = linkedMapOf<Long, Double>()
        for (linha in linhas) {
            if (linha.valor <= 0) {
                throw invalido("VENDA_VALOR_INVALIDO", "O valor do pagamento deve ser maior que zero")
            }
            caixaService.buscarFinalizador(linha.idFinalizador)
            agrupado[linha.idFinalizador] = (agrupado[linha.idFinalizador] ?: 0.0) + linha.valor
        }
        val soma = agrupado.values.sum()
        if (abs(soma - totalPyg) > 1.0) {
            throw invalido("VENDA_NEGOCIACAO_DIVERGENTE", "A soma das formas de pagamento deve igualar o total")
        }
        val nomes = caixaService.listarFinalizadores().associate { it.id to it.nome }
        return agrupado.map { (idFinalizador, valor) ->
            VendaNegociacaoPersistencia(
                idFinalizador = idFinalizador,
                finalizadorNome = nomes[idFinalizador] ?: "",
                valor = valor,
            )
        }
    }

    private fun paraPyg(valor: Double, moeda: Moeda, cotacao: CotacaoResponse): Double {
        val bruto = when (moeda) {
            Moeda.USD -> valor * cotacao.usdPyg
            Moeda.BRL -> valor * cotacao.brlPyg
            Moeda.PYG -> valor
        }
        return round(bruto)
    }

    private suspend fun resolverFilialComAcesso(idUsuario: Long, idFilial: Long?): Long {
        val resolvida = empresaService.resolverFilialCadastro(idFilial)
        exigirAcessoFilial(idUsuario, resolvida)
        return resolvida
    }

    private suspend fun exigirAcessoFilial(idUsuario: Long, idFilial: Long) {
        if (!usuarioRepository.temAcessoFilial(idUsuario, idFilial)) {
            throw acesso("SEM_ACESSO_FILIAL", "Sem acesso à filial")
        }
    }

    private fun VendaCompleta.toResponse() = VendaResponse(
        id = id,
        idFilial = idFilial,
        filialNome = filialNome,
        idCliente = idCliente,
        clienteNome = clienteNome,
        idVendedor = idVendedor,
        vendedorNome = vendedorNome,
        idCaixaSessao = idCaixaSessao,
        idCotacao = idCotacao,
        totalPyg = totalPyg,
        observacao = observacao,
        criadoEm = criadoEm,
        status = StatusVenda.valueOf(status.uppercase()),
        itens = itens.map {
            VendaItemResponse(
                id = it.id,
                idProduto = it.idProduto,
                produtoCodigo = it.produtoCodigo,
                produtoNome = it.produtoNome,
                idEstoque = it.idEstoque,
                estoqueNome = it.estoqueNome,
                quantidade = it.quantidade,
                aliquotaIva = it.aliquotaIva,
                moedaPreco = it.moedaPreco,
                precoLista = it.precoLista,
                precoUnitarioPyg = it.precoUnitarioPyg,
                totalPyg = it.totalPyg,
            )
        },
        negociacao = negociacao.map {
            VendaNegociacaoResponse(
                id = it.id,
                idFinalizador = it.idFinalizador,
                finalizadorNome = it.finalizadorNome,
                valor = it.valor,
            )
        },
    )
}
