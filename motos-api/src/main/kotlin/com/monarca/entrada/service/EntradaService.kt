package com.monarca.entrada.service

import com.monarca.caixa.service.CaixaService
import com.monarca.common.enums.Status
import com.monarca.cotacao.dto.CotacaoResponse
import com.monarca.cotacao.service.CotacaoService
import com.monarca.empresa.service.EmpresaService
import com.monarca.entrada.domain.TipoDocumentoEntrada
import com.monarca.entrada.dto.EntradaItemResponse
import com.monarca.entrada.dto.EntradaNegociacaoRequest
import com.monarca.entrada.dto.EntradaNegociacaoResponse
import com.monarca.entrada.dto.EntradaRequest
import com.monarca.entrada.dto.EntradaResponse
import com.monarca.entrada.dto.EntradaResumoResponse
import com.monarca.entrada.repository.EntradaCompleta
import com.monarca.entrada.repository.EntradaItemPersistencia
import com.monarca.entrada.repository.EntradaNegociacaoPersistencia
import com.monarca.entrada.repository.EntradaNova
import com.monarca.entrada.repository.EntradaRepository
import com.monarca.localidade.service.RecursoNaoEncontrado
import com.monarca.localidade.service.acesso
import com.monarca.localidade.service.invalido
import com.monarca.pessoa.service.PapelService
import com.monarca.produto.ChassiIntervaloGrande
import com.monarca.produto.ChassiIntervaloInvalido
import com.monarca.produto.ChassiNumeros
import com.monarca.produto.domain.Moeda
import com.monarca.produto.repository.ProdutoRepository
import com.monarca.titulo.domain.OrigemTitulo
import com.monarca.titulo.repository.TituloPagarNovo
import com.monarca.titulo.service.TituloService
import com.monarca.usuario.repository.UsuarioRepository
import java.time.LocalDate
import java.time.ZoneId
import kotlin.math.abs
import kotlin.math.round

class EntradaService(
    private val repository: EntradaRepository,
    private val cotacaoService: CotacaoService,
    private val caixaService: CaixaService,
    private val empresaService: EmpresaService,
    private val usuarioRepository: UsuarioRepository,
    private val produtoRepository: ProdutoRepository,
    private val papelService: PapelService,
    private val tituloService: TituloService,
    private val zoneId: ZoneId = ZoneId.of("America/Asuncion"),
) {

    suspend fun listar(idFilial: Long?, idUsuario: Long): List<EntradaResumoResponse> {
        val filial = resolverFilial(idUsuario, idFilial)
        return repository.listar(filial).map { it.toResumo() }
    }

    suspend fun buscar(id: Long, idUsuario: Long): EntradaResponse {
        val entrada = repository.buscar(id) ?: throw RecursoNaoEncontrado("Entrada $id não encontrada")
        exigirAcessoFilial(idUsuario, entrada.idFilial)
        return entrada.toResponse()
    }

    suspend fun criar(request: EntradaRequest, idUsuario: Long): EntradaResponse {
        cotacaoService.exigirAtiva()
        val cotacao = cotacaoService.buscarHoje()
        val idFilial = resolverFilial(idUsuario, request.idFilial)
        validarFornecedor(request.idFornecedor, idFilial)
        validarDocumento(request, idFilial)
        if (request.itens.isEmpty()) {
            throw invalido("ENTRADA_ITENS_OBRIGATORIOS", "Informe ao menos um item")
        }
        val itens = montarItens(request, idFilial, cotacao)
        val totalDoc = itens.sumOf { it.valor }
        val totalPyg = itens.sumOf { it.valorPyg }
        if (totalDoc <= 0 || totalPyg <= 0) {
            throw invalido("ENTRADA_TOTAL_INVALIDO", "O total da entrada deve ser maior que zero")
        }
        val negociacao = montarNegociacao(request.negociacao, totalPyg, cotacao)
        val finais = caixaService.listarFinalizadores().associateBy { it.id }
        val credito = negociacao.filter { finais[it.idFinalizador]?.geraContasPagar == true }
        val vista = negociacao.filter { finais[it.idFinalizador]?.geraContasPagar != true }
        if (credito.size > 1) {
            throw invalido("ENTRADA_CREDITO_UNICO", "Use só uma forma a prazo por entrada")
        }
        if (credito.isNotEmpty() && credito.map { it.moeda }.distinct().size > 1) {
            throw invalido("ENTRADA_CREDITO_MOEDA", "O prazo do fornecedor deve estar em uma única moeda")
        }
        val tituloPagar = if (credito.isNotEmpty()) {
            val cfg = request.parcelas
                ?: throw invalido("PARCELAS_OBRIGATORIAS", "Informe as parcelas do prazo ao fornecedor")
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
            TituloPagarNovo(
                idFilial = idFilial,
                idFornecedor = request.idFornecedor,
                origem = OrigemTitulo.COMPRA,
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
        val sessao = if (vista.isNotEmpty()) {
            caixaService.resolverSessaoVenda(idUsuario, idFilial, request.idCaixaSessao)
        } else {
            null
        }
        val id = repository.inserir(
            EntradaNova(
                idFilial = idFilial,
                idFornecedor = request.idFornecedor,
                tipoDocumento = request.tipoDocumento,
                dataEmissao = request.dataEmissao.trim(),
                moeda = request.moeda,
                valor = arredondar(totalDoc, request.moeda),
                valorPyg = round(totalPyg),
                idCotacao = cotacao.id,
                usdPyg = cotacao.usdPyg,
                brlPyg = cotacao.brlPyg,
                timbrado = request.timbrado?.trim()?.ifBlank { null },
                establecimiento = request.establecimiento?.trim()?.ifBlank { null },
                puntoExpedicion = request.puntoExpedicion?.trim()?.ifBlank { null },
                numero = request.numero?.trim()?.ifBlank { null },
                cdc = request.cdc?.trim()?.ifBlank { null },
                condicion = request.condicion,
                numeroDocumento = request.numeroDocumento?.trim()?.ifBlank { null },
                incoterm = request.incoterm?.trim()?.ifBlank { null },
                idCaixaSessao = sessao?.sessao?.id,
                observacao = request.observacao?.trim()?.ifBlank { null },
                itens = itens,
                negociacao = negociacao,
                negociacaoCaixa = vista,
                tituloPagar = tituloPagar,
                idUsuario = idUsuario,
            ),
        )
        return buscar(id, idUsuario)
    }

    private suspend fun validarDocumento(request: EntradaRequest, idFilial: Long) {
        if (request.dataEmissao.isBlank()) {
            throw invalido("ENTRADA_DATA", "Informe a data de emissão")
        }
        when (request.tipoDocumento) {
            TipoDocumentoEntrada.PY_FACTURA -> {
                val timbrado = request.timbrado?.trim().orEmpty()
                val est = request.establecimiento?.trim().orEmpty()
                val punto = request.puntoExpedicion?.trim().orEmpty()
                val numero = request.numero?.trim().orEmpty()
                if (timbrado.isEmpty() || est.isEmpty() || punto.isEmpty() || numero.isEmpty()) {
                    throw invalido("ENTRADA_PY_CAMPOS", "Informe timbrado, establecimiento, punto e número da factura")
                }
                val cdc = request.cdc?.trim()
                if (!cdc.isNullOrEmpty() && cdc.length != 44) {
                    throw invalido("ENTRADA_CDC", "O CDC deve ter 44 caracteres")
                }
                if (repository.existePyDuplicada(idFilial, request.idFornecedor, timbrado, est, punto, numero)) {
                    throw invalido("ENTRADA_PY_DUPLICADA", "Esta factura já foi lançada para o fornecedor")
                }
            }
            TipoDocumentoEntrada.EXTERIOR -> {
                if (request.numeroDocumento.isNullOrBlank()) {
                    throw invalido("ENTRADA_EXTERIOR_NUMERO", "Informe o número do documento / packing list")
                }
            }
        }
    }

    private suspend fun montarItens(
        request: EntradaRequest,
        idFilial: Long,
        cotacao: CotacaoResponse,
    ): List<EntradaItemPersistencia> {
        val out = mutableListOf<EntradaItemPersistencia>()
        val chassisUsados = mutableSetOf<String>()
        for (item in request.itens) {
            if (item.valorUnitario <= 0) {
                throw invalido("ENTRADA_VALOR_UNITARIO", "O valor unitário deve ser maior que zero")
            }
            val completo = produtoRepository.buscar(item.idProduto)
                ?: throw RecursoNaoEncontrado("Produto ${item.idProduto} não encontrado")
            val produto = completo.produto
            if (produto.status != Status.ATIVO) {
                throw invalido("PRODUTO_INATIVO", "O produto ${produto.codigo} não está ativo")
            }
            val saldos = produtoRepository.listarEstoqueDoProduto(item.idProduto, idFilial)
            val padrao = saldos.find { it.padrao }
                ?: throw invalido("ESTOQUE_PADRAO", "Sem estoque padrão na filial para ${produto.codigo}")
            val idEstoque = item.idEstoque ?: padrao.idEstoque
            val escolhido = saldos.find { it.idEstoque == idEstoque }
                ?: throw invalido("ESTOQUE_INVALIDO", "Estoque inválido para ${produto.codigo}")
            val chassis = try {
                ChassiNumeros.expandirLista(item.numerosChassis)
            } catch (_: ChassiIntervaloInvalido) {
                throw invalido("CHASSI_INTERVALO", "Intervalo de chassi inválido")
            } catch (e: ChassiIntervaloGrande) {
                throw invalido("CHASSI_MAXIMO", "Intervalo de chassi maior que ${e.maximo}")
            }
            val quantidade: Int
            val numeros: List<String>
            if (produto.controlaChassi) {
                if (chassis.isEmpty()) {
                    throw invalido("UNIDADE_OBRIGATORIA", "Informe os chassis do produto ${produto.codigo}")
                }
                if (chassis.size != chassis.distinct().size) {
                    throw invalido("UNIDADE_REPETIDA", "Há chassis repetidos na entrada")
                }
                for (n in chassis) {
                    if (!chassisUsados.add(n)) {
                        throw invalido("UNIDADE_REPETIDA", "Chassi $n repetido na entrada")
                    }
                }
                quantidade = chassis.size
                numeros = chassis
            } else {
                if (chassis.isNotEmpty()) {
                    throw invalido("CHASSI_NAO_CONTROLADO", "Este produto não controla chassis")
                }
                if (item.quantidade <= 0) {
                    throw invalido("ENTRADA_QTD_INVALIDA", "A quantidade deve ser maior que zero")
                }
                quantidade = item.quantidade
                numeros = emptyList()
            }
            val valor = arredondar(item.valorUnitario * quantidade, request.moeda)
            out += EntradaItemPersistencia(
                idProduto = produto.id,
                produtoCodigo = produto.codigo,
                produtoNome = produto.nome,
                idEstoque = escolhido.idEstoque,
                estoqueNome = escolhido.estoqueNome,
                quantidade = quantidade,
                aliquotaIva = produto.aliquotaIva,
                moeda = request.moeda,
                valorUnitario = item.valorUnitario,
                valor = valor,
                valorPyg = paraPyg(valor, request.moeda, cotacao),
                numerosChassis = numeros,
            )
        }
        return out
    }

    private suspend fun montarNegociacao(
        linhas: List<EntradaNegociacaoRequest>,
        totalPyg: Double,
        cotacao: CotacaoResponse,
    ): List<EntradaNegociacaoPersistencia> {
        if (linhas.isEmpty()) {
            throw invalido("ENTRADA_NEGOCIACAO_OBRIGATORIA", "Informe ao menos uma forma de pagamento")
        }
        val agrupado = linkedMapOf<Pair<Long, Moeda>, Double>()
        for (linha in linhas) {
            if (linha.valor <= 0) {
                throw invalido("ENTRADA_VALOR_INVALIDO", "O valor do pagamento deve ser maior que zero")
            }
            val fin = caixaService.buscarFinalizador(linha.idFinalizador)
            if (fin.geraContasReceber) {
                throw invalido("FINALIZADOR_RECEBER_NA_ENTRADA", "Não use finalizador de contas a receber na entrada")
            }
            val chave = linha.idFinalizador to linha.moeda
            agrupado[chave] = (agrupado[chave] ?: 0.0) + linha.valor
        }
        val montado = agrupado.map { (chave, valor) ->
            val (idFinalizador, moeda) = chave
            Triple(idFinalizador, moeda, valor to paraPyg(valor, moeda, cotacao))
        }
        val soma = montado.sumOf { it.third.second }
        if (abs(soma - totalPyg) > 1.0) {
            throw invalido("ENTRADA_NEGOCIACAO_DIVERGENTE", "A soma das formas de pagamento deve igualar o total")
        }
        return montado.map { (idFinalizador, moeda, valores) ->
            EntradaNegociacaoPersistencia(
                idFinalizador = idFinalizador,
                moeda = moeda.name.lowercase(),
                valor = valores.first,
                valorPyg = valores.second,
            )
        }
    }

    private suspend fun validarFornecedor(idFornecedor: Long, idFilial: Long) {
        val forn = papelService.buscarFornecedor(idFornecedor)
        if (forn.status != Status.ATIVO) {
            throw invalido("FORNECEDOR_INATIVO", "O fornecedor não está ativo")
        }
        val vinculado = forn.idFilialCadastro == idFilial ||
            forn.filiaisVinculadas.any { it.id == idFilial }
        if (!vinculado) {
            throw invalido("FORNECEDOR_FILIAL", "O fornecedor não pertence a esta filial")
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

    private fun paraPyg(valor: Double, moeda: Moeda, cotacao: CotacaoResponse): Double =
        when (moeda) {
            Moeda.PYG -> round(valor)
            Moeda.USD -> round(valor * cotacao.usdPyg)
            Moeda.BRL -> round(valor * cotacao.brlPyg)
        }

    private fun arredondar(valor: Double, moeda: Moeda): Double =
        if (moeda == Moeda.PYG) round(valor) else round(valor * 100.0) / 100.0

    private fun EntradaCompleta.toResumo() = EntradaResumoResponse(
        id = id,
        idFilial = idFilial,
        idFornecedor = idFornecedor,
        fornecedorNome = fornecedorNome,
        tipoDocumento = tipoDocumento,
        dataEmissao = dataEmissao,
        moeda = moeda,
        valor = valor,
        valorPyg = valorPyg,
        documentoLabel = documentoLabel(),
        criadoEm = criadoEm,
        status = status,
    )

    private fun EntradaCompleta.toResponse() = EntradaResponse(
        id = id,
        idFilial = idFilial,
        filialNome = filialNome,
        idFornecedor = idFornecedor,
        fornecedorNome = fornecedorNome,
        tipoDocumento = tipoDocumento,
        dataEmissao = dataEmissao,
        moeda = moeda,
        valor = valor,
        valorPyg = valorPyg,
        idCotacao = idCotacao,
        usdPyg = usdPyg,
        brlPyg = brlPyg,
        timbrado = timbrado,
        establecimiento = establecimiento,
        puntoExpedicion = puntoExpedicion,
        numero = numero,
        cdc = cdc,
        condicion = condicion,
        numeroDocumento = numeroDocumento,
        incoterm = incoterm,
        idCaixaSessao = idCaixaSessao,
        idTituloPagar = idTituloPagar,
        observacao = observacao,
        criadoEm = criadoEm,
        status = status,
        itens = itens.map {
            EntradaItemResponse(
                id = it.id,
                idProduto = it.idProduto,
                produtoCodigo = it.produtoCodigo,
                produtoNome = it.produtoNome,
                idEstoque = it.idEstoque,
                estoqueNome = it.estoqueNome,
                quantidade = it.quantidade,
                aliquotaIva = it.aliquotaIva,
                moeda = it.moeda,
                valorUnitario = it.valorUnitario,
                valor = it.valor,
                valorPyg = it.valorPyg,
                chassis = it.chassis,
            )
        },
        negociacao = negociacao.map {
            EntradaNegociacaoResponse(
                id = it.id,
                idFinalizador = it.idFinalizador,
                finalizadorNome = it.finalizadorNome,
                moeda = it.moeda,
                valor = it.valor,
                valorPyg = it.valorPyg,
            )
        },
    )

    private fun EntradaCompleta.documentoLabel(): String =
        when (tipoDocumento) {
            TipoDocumentoEntrada.PY_FACTURA ->
                listOfNotNull(timbrado, establecimiento, puntoExpedicion, numero).joinToString("-")
            TipoDocumentoEntrada.EXTERIOR ->
                listOfNotNull(numeroDocumento, incoterm).joinToString(" · ").ifBlank { "—" }
        }
}
