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
import com.monarca.usuario.SystemUser
import com.monarca.usuario.repository.UsuarioRepository
import com.monarca.venda.domain.StatusVenda
import com.monarca.venda.dto.VendaItemResponse
import com.monarca.venda.dto.VendaNegociacaoRequest
import com.monarca.venda.dto.VendaNegociacaoResponse
import com.monarca.venda.dto.VendaRequest
import com.monarca.venda.dto.VendaResponse
import com.monarca.venda.dto.VendedorOpcaoResponse
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

    suspend fun listarVendedores(idFilial: Long?, idUsuario: Long): List<VendedorOpcaoResponse> {
        val filial = resolverFilialComAcesso(idUsuario, idFilial)
        return usuarioRepository.listarAtivosDaFilial(filial).map { VendedorOpcaoResponse(it.id, it.nome) }
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
        val negociacao = montarNegociacao(request.negociacao, totalPyg, cotacao)
        val idVendedor = resolverVendedor(request.idVendedor, idUsuario, idFilial)
        val id = repository.inserir(
            idFilial = idFilial,
            idCliente = request.idCliente,
            idVendedor = idVendedor,
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

    private suspend fun resolverVendedor(pedido: Long?, idOperador: Long, idFilial: Long): Long {
        val id = pedido ?: idOperador
        val vendedor = usuarioRepository.buscar(id)
            ?: throw RecursoNaoEncontrado("Vendedor $id não encontrado")
        if (SystemUser.isSystem(vendedor.login) && id != idOperador) {
            throw invalido("VENDEDOR_INVALIDO", "Este usuário não pode ser vendedor da venda")
        }
        if (vendedor.status != Status.ATIVO) {
            throw invalido("VENDEDOR_INATIVO", "O vendedor não está ativo")
        }
        if (!usuarioRepository.temAcessoFilial(id, idFilial)) {
            throw invalido("VENDEDOR_FILIAL", "O vendedor não tem acesso a esta filial")
        }
        return id
    }

    private suspend fun montarItens(
        request: VendaRequest,
        idFilial: Long,
        cotacao: CotacaoResponse,
    ): List<VendaItemPersistencia> {
        val agrupado = linkedMapOf<Pair<Long, Long?>, Pair<Int, MutableList<Long>>>()
        for (item in request.itens) {
            if (item.quantidade <= 0) {
                throw invalido("VENDA_QTD_INVALIDA", "A quantidade deve ser maior que zero")
            }
            val chave = item.idProduto to item.idEstoque
            val atual = agrupado[chave]
            if (atual == null) {
                agrupado[chave] = item.quantidade to item.idsUnidades.toMutableList()
            } else {
                atual.second += item.idsUnidades
                agrupado[chave] = (atual.first + item.quantidade) to atual.second
            }
        }
        return agrupado.map { (chave, acc) ->
            val (idProduto, idEstoquePedido) = chave
            val (quantidade, idsUnidades) = acc
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
            val padrao = saldos.find { it.padrao }
                ?: throw invalido("ESTOQUE_INSUFICIENTE", "Sem estoque padrão na filial para ${produto.codigo}")
            val escolhido = if (idEstoquePedido != null) {
                if (idEstoquePedido != padrao.idEstoque) {
                    throw invalido("ESTOQUE_NAO_PADRAO", "A venda usa só o estoque padrão da filial")
                }
                padrao
            } else {
                padrao
            }
            val unidades = validarUnidadesVenda(
                produto.controlaChassi,
                produto.codigo,
                idProduto,
                escolhido.idEstoque,
                quantidade,
                idsUnidades,
            )
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
                idsUnidades = unidades.map { it.id },
                chassis = unidades.map { it.numero },
            )
        }
    }

    private suspend fun validarUnidadesVenda(
        controlaChassi: Boolean,
        codigo: String,
        idProduto: Long,
        idEstoque: Long,
        quantidade: Int,
        idsUnidades: List<Long>,
    ): List<com.monarca.produto.domain.ProdutoUnidade> {
        if (!controlaChassi) {
            if (idsUnidades.isNotEmpty()) {
                throw invalido("CHASSI_NAO_CONTROLADO", "Este produto não controla chassis")
            }
            return emptyList()
        }
        if (idsUnidades.isEmpty()) {
            throw invalido("UNIDADE_OBRIGATORIA", "Informe o chassi do produto $codigo")
        }
        if (idsUnidades.size != idsUnidades.distinct().size) {
            throw invalido("UNIDADE_REPETIDA", "Há chassis repetidos na venda")
        }
        if (idsUnidades.size != quantidade) {
            throw invalido("UNIDADE_QTD", "A quantidade deve ser igual ao número de chassis")
        }
        val unidades = produtoRepository.buscarUnidadesPorIds(idsUnidades)
        if (unidades.size != idsUnidades.size) {
            throw invalido("UNIDADE_INVALIDA", "Chassi não encontrado")
        }
        for (u in unidades) {
            if (u.idProduto != idProduto || u.idEstoque != idEstoque) {
                throw invalido("UNIDADE_INVALIDA", "O chassi ${u.numero} não pertence a este produto")
            }
            if (u.situacao != com.monarca.produto.domain.SituacaoUnidade.DISPONIVEL) {
                throw invalido("UNIDADE_INDISPONIVEL", "O chassi ${u.numero} não está disponível", "chassi" to u.numero)
            }
        }
        return unidades
    }

    private suspend fun montarNegociacao(
        linhas: List<VendaNegociacaoRequest>,
        totalPyg: Double,
        cotacao: CotacaoResponse,
    ): List<VendaNegociacaoPersistencia> {
        if (linhas.isEmpty()) {
            throw invalido("VENDA_NEGOCIACAO_OBRIGATORIA", "Informe ao menos uma forma de pagamento")
        }
        val agrupado = linkedMapOf<Pair<Long, Moeda>, Double>()
        for (linha in linhas) {
            if (linha.valor <= 0) {
                throw invalido("VENDA_VALOR_INVALIDO", "O valor do pagamento deve ser maior que zero")
            }
            caixaService.buscarFinalizador(linha.idFinalizador)
            val chave = linha.idFinalizador to linha.moeda
            agrupado[chave] = (agrupado[chave] ?: 0.0) + linha.valor
        }
        val montado = agrupado.map { (chave, valor) ->
            val (idFinalizador, moeda) = chave
            Triple(idFinalizador, moeda, valor to paraPyg(valor, moeda, cotacao))
        }
        val soma = montado.sumOf { it.third.second }
        if (abs(soma - totalPyg) > 1.0) {
            throw invalido("VENDA_NEGOCIACAO_DIVERGENTE", "A soma das formas de pagamento deve igualar o total")
        }
        val nomes = caixaService.listarFinalizadores().associate { it.id to it.nome }
        return montado.map { (idFinalizador, moeda, valores) ->
            VendaNegociacaoPersistencia(
                idFinalizador = idFinalizador,
                finalizadorNome = nomes[idFinalizador] ?: "",
                moeda = moeda.name.lowercase(),
                valor = valores.first,
                valorPyg = valores.second,
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
                chassis = it.chassis,
            )
        },
        negociacao = negociacao.map {
            VendaNegociacaoResponse(
                id = it.id,
                idFinalizador = it.idFinalizador,
                finalizadorNome = it.finalizadorNome,
                moeda = Moeda.valueOf(it.moeda.uppercase()),
                valor = it.valor,
                valorPyg = it.valorPyg,
            )
        },
    )
}
