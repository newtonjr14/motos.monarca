package com.monarca.venda.service

import com.monarca.auth.domain.Permissao
import com.monarca.auth.domain.Rbac
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
import com.monarca.titulo.domain.OrigemTitulo
import com.monarca.titulo.repository.TituloReceberNovo
import com.monarca.titulo.service.TituloService
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
import java.time.LocalDate
import java.time.ZoneId
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
    private val tituloService: TituloService,
    private val zoneId: ZoneId = ZoneId.of("America/Asuncion"),
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

    suspend fun criar(request: VendaRequest, idUsuario: Long, idExistente: Long? = null): VendaResponse {
        cotacaoService.exigirAtiva()
        val cotacao = cotacaoService.buscarHoje()
        val idFilial = resolverFilialComAcesso(idUsuario, request.idFilial)
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
        val operador = usuarioRepository.buscar(idUsuario)
            ?: throw RecursoNaoEncontrado("Usuário $idUsuario não encontrado")
        val gravacao = when (request.gravacao) {
            "venda", "orcamento", "aberta" -> request.gravacao
            else -> throw invalido("VENDA_GRAVACAO", "Informe se é venda, orçamento ou em aberto")
        }
        val efetivar = gravacao == "venda"
        val hoje = LocalDate.now(zoneId).toString()
        val validade = if (gravacao == "orcamento") {
            val data = request.validade?.trim().orEmpty()
            if (!data.matches(Regex("\\d{4}-\\d{2}-\\d{2}"))) {
                throw invalido("ORCAMENTO_VALIDADE", "Informe a validade do orçamento")
            }
            if (data < hoje) {
                throw invalido("ORCAMENTO_VALIDADE", "A validade do orçamento não pode ser anterior a hoje")
            }
            data
        } else {
            null
        }
        val itens = montarItens(request, idFilial, cotacao, operador.perfil, efetivar)
        val subtotalPyg = itens.sumOf { it.totalPyg }
        val descontoPct = round(request.descontoPct * 100.0) / 100.0
        if (descontoPct < 0.0 || descontoPct > 100.0) {
            throw invalido("VENDA_DESCONTO_INVALIDO", "O desconto deve estar entre 0 e 100%")
        }
        if (descontoPct > 0.0 && !Rbac.possui(operador.perfil, Permissao.VENDA_DESCONTO)) {
            throw acesso(
                "PERMISSAO_INSUFICIENTE",
                "Permissão insuficiente: ${Permissao.VENDA_DESCONTO.codigo}",
                "permissao" to Permissao.VENDA_DESCONTO.codigo,
            )
        }
        val descontoPyg = round(subtotalPyg * descontoPct / 100.0)
        val totalPyg = (subtotalPyg - descontoPyg).coerceAtLeast(0.0)
        if (totalPyg <= 0) {
            throw invalido("VENDA_TOTAL_INVALIDO", "O total da venda deve ser maior que zero")
        }
        val negociacao = if (!efetivar && request.negociacao.isEmpty()) {
            emptyList()
        } else {
            montarNegociacao(request.negociacao, totalPyg, cotacao)
        }
        val finais = caixaService.listarFinalizadores().associateBy { it.id }
        val credito = negociacao.filter { finais[it.idFinalizador]?.geraContasReceber == true }
        val vista = negociacao.filter { finais[it.idFinalizador]?.geraContasReceber != true }
        if (credito.size > 1) {
            throw invalido("VENDA_CREDITO_UNICO", "Use só uma forma a prazo por venda")
        }
        if (credito.isNotEmpty() && credito.map { it.moeda }.distinct().size > 1) {
            throw invalido("VENDA_CREDITO_MOEDA", "O crediário deve estar em uma única moeda")
        }
        val tituloReceber = if (efetivar && credito.isNotEmpty()) {
            val cfg = request.parcelas
                ?: throw invalido("PARCELAS_OBRIGATORIAS", "Informe as parcelas do crediário")
            val linha = credito.first()
            val valor = credito.sumOf { it.valor }
            val valorPyg = credito.sumOf { it.valorPyg }
            val parcelas = tituloService.montarParcelas(
                cfg,
                valor,
                valorPyg,
                Moeda.valueOf(linha.moeda.uppercase()),
                LocalDate.now(zoneId),
            )
            TituloReceberNovo(
                idFilial = idFilial,
                idCliente = request.idCliente,
                origem = OrigemTitulo.VENDA,
                idVenda = null,
                moeda = Moeda.valueOf(linha.moeda.uppercase()),
                valor = valor,
                valorPyg = valorPyg,
                idCotacao = cotacao.id,
                usdPyg = cotacao.usdPyg,
                brlPyg = cotacao.brlPyg,
                observacao = request.observacao?.trim()?.ifBlank { null },
                parcelas = parcelas,
            )
        } else {
            if (request.parcelas != null) {
                throw invalido("PARCELAS_SEM_CREDITO", "Parcelas só se aplicam a finalizador a prazo")
            }
            null
        }
        val idVendedor = resolverVendedor(request.idVendedor, idUsuario, idFilial)
        val sessaoId = if (efetivar) {
            caixaService.resolverSessaoVenda(idUsuario, idFilial, request.idCaixaSessao).sessao.id
        } else {
            null
        }
        val status = when (gravacao) {
            "orcamento" -> StatusVenda.ORCAMENTO.name.lowercase()
            "aberta" -> StatusVenda.ABERTA.name.lowercase()
            else -> StatusVenda.FINALIZADA.name.lowercase()
        }
        if (idExistente != null && !efetivar) {
            repository.atualizarAberta(
                idVenda = idExistente,
                idCliente = request.idCliente,
                idVendedor = idVendedor,
                idCotacao = cotacao.id,
                totalPyg = totalPyg,
                descontoPct = descontoPct,
                descontoPyg = descontoPyg,
                observacao = request.observacao?.trim()?.ifBlank { null },
                itens = itens,
                idUsuario = idUsuario,
                idsOrcamentos = request.idsOrcamentos.distinct(),
            )
            return buscar(idExistente, idUsuario)
        }
        if (idExistente == null) {
        val id = repository.inserir(
            idFilial = idFilial,
            idCliente = request.idCliente,
            idVendedor = idVendedor,
            idCaixaSessao = sessaoId,
            idCotacao = cotacao.id,
            totalPyg = totalPyg,
            descontoPct = descontoPct,
            descontoPyg = descontoPyg,
            observacao = request.observacao?.trim()?.ifBlank { null },
            itens = itens,
            negociacao = negociacao,
            negociacaoCaixa = if (efetivar) vista else emptyList(),
            tituloReceber = tituloReceber,
            idUsuario = idUsuario,
            status = status,
            validade = validade,
            efetivar = efetivar,
            idsOrcamentos = if (efetivar) request.idsOrcamentos.distinct() else emptyList(),
            hoje = hoje,
            confirmarVencido = request.confirmarVencido,
        )
        return buscar(id, idUsuario)
        }
        val sessaoEfetiva = sessaoId ?: throw invalido("CAIXA_SESSAO_AUSENTE", "Abra o caixa antes de vender")
        repository.efetivar(
            idVenda = idExistente,
            idCaixaSessao = sessaoEfetiva,
            idCotacao = cotacao.id,
            totalPyg = totalPyg,
            descontoPct = descontoPct,
            descontoPyg = descontoPyg,
            observacao = request.observacao?.trim()?.ifBlank { null },
            itens = itens,
            negociacao = negociacao,
            negociacaoCaixa = vista,
            tituloReceber = tituloReceber,
            idUsuario = idUsuario,
            idsOrcamentos = request.idsOrcamentos.distinct(),
            hoje = hoje,
            confirmarVencido = request.confirmarVencido,
            idFilial = idFilial,
            idCliente = request.idCliente,
        )
        return buscar(idExistente, idUsuario)
    }

    suspend fun finalizar(id: Long, request: VendaRequest, idUsuario: Long): VendaResponse {
        val atual = repository.buscar(id) ?: throw RecursoNaoEncontrado("Venda $id não encontrada")
        exigirAcessoFilial(idUsuario, atual.idFilial)
        if (atual.status != StatusVenda.ABERTA.name.lowercase()) {
            throw invalido("VENDA_NAO_ABERTA", "Só uma venda em aberto pode ser finalizada")
        }
        return criar(
            request.copy(
                gravacao = "venda",
                idFilial = atual.idFilial,
                idsOrcamentos = (request.idsOrcamentos + atual.idsOrcamentos).distinct(),
            ),
            idUsuario,
            id,
        )
    }

    suspend fun atualizarAberta(id: Long, request: VendaRequest, idUsuario: Long): VendaResponse {
        val atual = repository.buscar(id) ?: throw RecursoNaoEncontrado("Venda $id não encontrada")
        exigirAcessoFilial(idUsuario, atual.idFilial)
        if (atual.status != StatusVenda.ABERTA.name.lowercase()) {
            throw invalido("VENDA_NAO_ABERTA", "Só uma venda em aberto pode ser atualizada")
        }
        return criar(request.copy(gravacao = "aberta", idFilial = atual.idFilial), idUsuario, id)
    }

    suspend fun cancelar(id: Long, idUsuario: Long): VendaResponse {
        val atual = repository.buscar(id) ?: throw RecursoNaoEncontrado("Venda $id não encontrada")
        exigirAcessoFilial(idUsuario, atual.idFilial)
        if (atual.status != StatusVenda.ABERTA.name.lowercase() && atual.status != StatusVenda.ORCAMENTO.name.lowercase()) {
            throw invalido("VENDA_NAO_CANCELAVEL", "Só um orçamento ou uma venda em aberto pode ser cancelada")
        }
        repository.cancelar(id)
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
        perfil: com.monarca.usuario.domain.PerfilUsuario,
        efetivar: Boolean,
    ): List<VendaItemPersistencia> {
        val podeDesconto = Rbac.possui(perfil, Permissao.VENDA_DESCONTO)
        data class Acc(val quantidade: Int, val idsUnidades: MutableList<Long>, val descontoPct: Double)
        val agrupado = linkedMapOf<Triple<Long, Long?, Double>, Acc>()
        for (item in request.itens) {
            if (item.quantidade <= 0) {
                throw invalido("VENDA_QTD_INVALIDA", "A quantidade deve ser maior que zero")
            }
            val pct = round(item.descontoPct * 100.0) / 100.0
            if (pct < 0.0 || pct > 100.0) {
                throw invalido("VENDA_DESCONTO_INVALIDO", "O desconto deve estar entre 0 e 100%")
            }
            if (pct > 0.0 && !podeDesconto) {
                throw acesso(
                    "PERMISSAO_INSUFICIENTE",
                    "Permissão insuficiente: ${Permissao.VENDA_DESCONTO.codigo}",
                    "permissao" to Permissao.VENDA_DESCONTO.codigo,
                )
            }
            val chave = Triple(item.idProduto, item.idEstoque, pct)
            val atual = agrupado[chave]
            if (atual == null) {
                agrupado[chave] = Acc(item.quantidade, item.idsUnidades.toMutableList(), pct)
            } else {
                atual.idsUnidades += item.idsUnidades
                agrupado[chave] = Acc(atual.quantidade + item.quantidade, atual.idsUnidades, pct)
            }
        }
        return agrupado.map { (chave, acc) ->
            val (idProduto, idEstoquePedido, _) = chave
            val quantidade = acc.quantidade
            val idsUnidades = acc.idsUnidades
            val descontoPct = acc.descontoPct
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
            val unidades = if (efetivar) {
                validarUnidadesVenda(
                    produto.controlaChassi,
                    produto.codigo,
                    idProduto,
                    escolhido.idEstoque,
                    quantidade,
                    idsUnidades,
                )
            } else {
                emptyList()
            }
            if (efetivar && escolhido.quantidadeDisponivel < quantidade) {
                throw invalido("ESTOQUE_INSUFICIENTE", "Saldo insuficiente para vender ${produto.codigo}")
            }
            val unitario = paraPyg(produto.precoLista, produto.moedaPreco, cotacao)
            val bruto = unitario * quantidade
            val descontoPyg = round(bruto * descontoPct / 100.0)
            val totalLinha = (bruto - descontoPyg).coerceAtLeast(0.0)
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
                descontoPct = descontoPct,
                descontoPyg = descontoPyg,
                totalPyg = totalLinha,
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
            LinhaNegociacao(idFinalizador, moeda, valor, paraPyg(valor, moeda, cotacao))
        }.toMutableList()
        val soma = montado.sumOf { it.valorPyg }
        val diff = totalPyg - soma
        if (abs(diff) > toleranciaFechamento(cotacao)) {
            throw invalido("VENDA_NEGOCIACAO_DIVERGENTE", "A soma das formas de pagamento deve igualar o total")
        }
        if (diff != 0.0 && montado.isNotEmpty()) {
            val ultima = montado.last()
            montado[montado.lastIndex] = ultima.copy(valorPyg = ultima.valorPyg + diff)
        }
        val nomes = caixaService.listarFinalizadores().associate { it.id to it.nome }
        return montado.map { linha ->
            VendaNegociacaoPersistencia(
                idFinalizador = linha.idFinalizador,
                finalizadorNome = nomes[linha.idFinalizador] ?: "",
                moeda = linha.moeda.name.lowercase(),
                valor = linha.valor,
                valorPyg = linha.valorPyg,
            )
        }
    }

    private data class LinhaNegociacao(
        val idFinalizador: Long,
        val moeda: Moeda,
        val valor: Double,
        val valorPyg: Double,
    )

    private fun toleranciaFechamento(cotacao: CotacaoResponse): Double {
        val centavos = maxOf(cotacao.usdPyg, cotacao.brlPyg) * 0.02
        return maxOf(1.0, centavos)
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
        clienteEndereco = clienteEndereco,
        clienteTelefone = clienteTelefone,
        validade = validade,
        idVendaGerada = idVendaGerada,
        idsOrcamentos = idsOrcamentos,
        usdPyg = usdPyg,
        brlPyg = brlPyg,
        totalPyg = totalPyg,
        descontoPct = descontoPct,
        descontoPyg = descontoPyg,
        observacao = observacao,
        criadoEm = criadoEm,
        finalizadaEm = finalizadaEm,
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
                descontoPct = it.descontoPct,
                descontoPyg = it.descontoPyg,
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
                quantidadeParcelas = it.quantidadeParcelas,
            )
        },
    )
}
