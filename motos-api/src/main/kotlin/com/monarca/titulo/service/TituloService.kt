package com.monarca.titulo.service

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
import com.monarca.titulo.GeradorParcelas
import com.monarca.titulo.domain.ModoVencimento
import com.monarca.titulo.domain.OrigemTitulo
import com.monarca.titulo.domain.StatusParcela
import com.monarca.titulo.domain.StatusTitulo
import com.monarca.titulo.dto.BaixaRelatorioResponse
import com.monarca.titulo.dto.BaixaResponse
import com.monarca.titulo.dto.BaixaTituloRequest
import com.monarca.titulo.dto.ParcelaResponse
import com.monarca.titulo.dto.ParcelasConfigRequest
import com.monarca.titulo.dto.TituloPagarRequest
import com.monarca.titulo.dto.TituloPagarResponse
import com.monarca.titulo.dto.TituloPagarResumoResponse
import com.monarca.titulo.dto.RelatorioParcelaResponse
import com.monarca.titulo.dto.TituloReceberRequest
import com.monarca.titulo.dto.TituloReceberResponse
import com.monarca.titulo.dto.TituloReceberResumoResponse
import com.monarca.titulo.repository.BaixaRelatorioLinha
import com.monarca.titulo.repository.BaixaNova
import com.monarca.titulo.repository.BaixaParcelaAplicacao
import com.monarca.titulo.repository.BaixaPersistida
import com.monarca.titulo.repository.ParcelaPersistida
import com.monarca.titulo.repository.TituloPagarCompleto
import com.monarca.titulo.repository.TituloPagarNovo
import com.monarca.titulo.repository.TituloReceberCompleto
import com.monarca.titulo.repository.TituloReceberNovo
import com.monarca.titulo.repository.TituloRepository
import com.monarca.usuario.repository.UsuarioRepository
import java.time.LocalDate
import java.time.ZoneId
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.round

class TituloService(
    private val repository: TituloRepository,
    private val cotacaoService: CotacaoService,
    private val empresaService: EmpresaService,
    private val papelService: PapelService,
    private val caixaService: CaixaService,
    private val usuarioRepository: UsuarioRepository,
    private val zoneId: ZoneId = ZoneId.of("America/Asuncion"),
) {
    suspend fun listarReceber(idFilial: Long?, idUsuario: Long): List<TituloReceberResumoResponse> {
        val filial = resolverFilial(idUsuario, idFilial)
        return repository.listarReceber(filial).map { it.toResumo() }
    }

    suspend fun buscarReceber(id: Long, idUsuario: Long): TituloReceberResponse {
        val titulo = repository.buscarReceber(id) ?: throw RecursoNaoEncontrado("Título a receber $id não encontrado")
        exigirAcessoFilial(idUsuario, titulo.idFilial)
        return titulo.toResponse()
    }

    suspend fun criarReceberManual(request: TituloReceberRequest, idUsuario: Long): TituloReceberResponse {
        cotacaoService.exigirAtiva()
        val cotacao = cotacaoService.buscarHoje()
        val idFilial = resolverFilial(idUsuario, request.idFilial)
        validarCliente(request.idCliente, idFilial)
        if (request.valor <= 0) throw invalido("TITULO_VALOR_INVALIDO", "O valor deve ser maior que zero")
        val valorPyg = paraPyg(request.valor, request.moeda, cotacao)
        val parcelas = montarParcelas(request.parcelas, request.valor, valorPyg, request.moeda, hoje())
        val id = repository.inserirReceber(
            TituloReceberNovo(
                idFilial = idFilial,
                idCliente = request.idCliente,
                origem = OrigemTitulo.MANUAL,
                idVenda = null,
                moeda = request.moeda,
                valor = request.valor,
                valorPyg = valorPyg,
                idCotacao = cotacao.id,
                usdPyg = cotacao.usdPyg,
                brlPyg = cotacao.brlPyg,
                observacao = request.observacao?.trim()?.ifBlank { null },
                parcelas = parcelas,
            ),
        )
        return buscarReceber(id, idUsuario)
    }

    suspend fun criarReceberDaVenda(
        idFilial: Long,
        idCliente: Long,
        idVenda: Long,
        moeda: Moeda,
        valor: Double,
        valorPyg: Double,
        cotacao: CotacaoResponse,
        parcelas: ParcelasConfigRequest,
        observacao: String?,
    ): Long {
        val geradas = montarParcelas(parcelas, valor, valorPyg, moeda, hoje())
        return repository.inserirReceber(
            TituloReceberNovo(
                idFilial = idFilial,
                idCliente = idCliente,
                origem = OrigemTitulo.VENDA,
                idVenda = idVenda,
                moeda = moeda,
                valor = valor,
                valorPyg = valorPyg,
                idCotacao = cotacao.id,
                usdPyg = cotacao.usdPyg,
                brlPyg = cotacao.brlPyg,
                observacao = observacao,
                parcelas = geradas,
            ),
        )
    }

    suspend fun baixarReceber(request: BaixaTituloRequest, idUsuario: Long): TituloReceberResponse {
        cotacaoService.exigirAtiva()
        val ids = resolverIdsParcelas(request)
        val primeiro = repository.buscarParcelaReceber(ids.first())
            ?: throw RecursoNaoEncontrado("Parcela ${ids.first()} não encontrada")
        val titulo = primeiro.first
        exigirAcessoFilial(idUsuario, titulo.idFilial)
        val parcelas = ids.map { id ->
            val pair = repository.buscarParcelaReceber(id)
                ?: throw RecursoNaoEncontrado("Parcela $id não encontrada")
            if (pair.first.id != titulo.id) {
                throw invalido("BAIXA_TITULO_MISTO", "Selecione parcelas do mesmo título/cliente")
            }
            if (pair.first.idCliente != titulo.idCliente) {
                throw invalido("BAIXA_CLIENTE_MISTO", "Não é possível misturar clientes no mesmo recebimento")
            }
            pair.second
        }.sortedWith(compareBy({ it.vencimento }, { it.numero }))
        for (p in parcelas) {
            if (p.saldo <= 0 || p.status == StatusParcela.PAGA || p.status == StatusParcela.CANCELADA) {
                throw invalido("PARCELA_JA_PAGA", "A parcela ${p.numero} já está quitada")
            }
        }
        val finalizador = caixaService.buscarFinalizador(request.idFinalizador)
        if (finalizador.geraContasReceber || finalizador.geraContasPagar) {
            throw invalido("FINALIZADOR_NAO_LIQUIDA", "Use uma forma de caixa para liquidar a parcela")
        }
        if (finalizador.status != Status.ATIVO) {
            throw invalido("FINALIZADOR_INATIVO", "O finalizador não está ativo")
        }
        val sessao = caixaService.resolverSessaoVenda(idUsuario, titulo.idFilial, request.idCaixaSessao)
        val aplicacoes = montarAplicacoes(parcelas, request, titulo.moeda, titulo.usdPyg, titulo.brlPyg)
        val saldosApos = titulo.parcelas.associate { it.id to it.saldo }.toMutableMap()
        for (ap in aplicacoes) saldosApos[ap.idParcela] = ap.saldoRestante
        val statusTitulo = statusTituloApos(titulo.parcelas, saldosApos)
        repository.baixarReceberLote(
            aplicacoes = aplicacoes,
            comum = BaixaNova(
                idParcela = aplicacoes.first().idParcela,
                idFinalizador = request.idFinalizador,
                idCaixaSessao = sessao.sessao.id,
                moeda = request.moeda,
                valor = request.valor,
                valorPyg = aplicacoes.sumOf { it.valorPyg },
                idUsuario = idUsuario,
                observacao = request.observacao?.trim()?.ifBlank { null },
                tipoMovimento = "recebimento",
            ),
            idTitulo = titulo.id,
            statusTitulo = statusTitulo,
        )
        return buscarReceber(titulo.id, idUsuario)
    }

    suspend fun listarPagar(idFilial: Long?, idUsuario: Long): List<TituloPagarResumoResponse> {
        val filial = resolverFilial(idUsuario, idFilial)
        return repository.listarPagar(filial).map { it.toResumo() }
    }

    suspend fun listarParcelasReceber(idFilial: Long?, idUsuario: Long): List<RelatorioParcelaResponse> {
        val filial = resolverFilial(idUsuario, idFilial)
        return repository.listarReceber(filial).flatMap { it.toParcelasReceber() }
    }

    suspend fun listarParcelasPagar(idFilial: Long?, idUsuario: Long): List<RelatorioParcelaResponse> {
        val filial = resolverFilial(idUsuario, idFilial)
        return repository.listarPagar(filial).flatMap { it.toParcelasPagar() }
    }

    suspend fun listarBaixasReceber(idFilial: Long?, idUsuario: Long): List<BaixaRelatorioResponse> {
        val filial = resolverFilial(idUsuario, idFilial)
        return repository.listarBaixasReceber(filial).map { it.toRelatorio() }
    }

    suspend fun listarBaixasPagar(idFilial: Long?, idUsuario: Long): List<BaixaRelatorioResponse> {
        val filial = resolverFilial(idUsuario, idFilial)
        return repository.listarBaixasPagar(filial).map { it.toRelatorio() }
    }

    suspend fun buscarPagar(id: Long, idUsuario: Long): TituloPagarResponse {
        val titulo = repository.buscarPagar(id) ?: throw RecursoNaoEncontrado("Título a pagar $id não encontrado")
        exigirAcessoFilial(idUsuario, titulo.idFilial)
        return titulo.toResponse()
    }

    suspend fun criarPagarManual(request: TituloPagarRequest, idUsuario: Long): TituloPagarResponse {
        cotacaoService.exigirAtiva()
        val cotacao = cotacaoService.buscarHoje()
        val idFilial = resolverFilial(idUsuario, request.idFilial)
        validarFornecedor(request.idFornecedor, idFilial)
        if (request.valor <= 0) throw invalido("TITULO_VALOR_INVALIDO", "O valor deve ser maior que zero")
        val valorPyg = paraPyg(request.valor, request.moeda, cotacao)
        val parcelas = montarParcelas(request.parcelas, request.valor, valorPyg, request.moeda, hoje())
        val id = repository.inserirPagar(
            TituloPagarNovo(
                idFilial = idFilial,
                idFornecedor = request.idFornecedor,
                origem = OrigemTitulo.MANUAL,
                moeda = request.moeda,
                valor = request.valor,
                valorPyg = valorPyg,
                idCotacao = cotacao.id,
                usdPyg = cotacao.usdPyg,
                brlPyg = cotacao.brlPyg,
                observacao = request.observacao?.trim()?.ifBlank { null },
                parcelas = parcelas,
            ),
        )
        return buscarPagar(id, idUsuario)
    }

    suspend fun baixarPagar(request: BaixaTituloRequest, idUsuario: Long): TituloPagarResponse {
        cotacaoService.exigirAtiva()
        val ids = resolverIdsParcelas(request)
        val primeiro = repository.buscarParcelaPagar(ids.first())
            ?: throw RecursoNaoEncontrado("Parcela ${ids.first()} não encontrada")
        val titulo = primeiro.first
        exigirAcessoFilial(idUsuario, titulo.idFilial)
        val parcelas = ids.map { id ->
            val pair = repository.buscarParcelaPagar(id)
                ?: throw RecursoNaoEncontrado("Parcela $id não encontrada")
            if (pair.first.id != titulo.id) {
                throw invalido("BAIXA_TITULO_MISTO", "Selecione parcelas do mesmo título/fornecedor")
            }
            if (pair.first.idFornecedor != titulo.idFornecedor) {
                throw invalido("BAIXA_FORNECEDOR_MISTO", "Não é possível misturar fornecedores no mesmo pagamento")
            }
            pair.second
        }.sortedWith(compareBy({ it.vencimento }, { it.numero }))
        for (p in parcelas) {
            if (p.saldo <= 0 || p.status == StatusParcela.PAGA || p.status == StatusParcela.CANCELADA) {
                throw invalido("PARCELA_JA_PAGA", "A parcela ${p.numero} já está quitada")
            }
        }
        val finalizador = caixaService.buscarFinalizador(request.idFinalizador)
        if (finalizador.geraContasReceber || finalizador.geraContasPagar) {
            throw invalido("FINALIZADOR_NAO_LIQUIDA", "Use uma forma de caixa para liquidar a parcela")
        }
        if (finalizador.status != Status.ATIVO) {
            throw invalido("FINALIZADOR_INATIVO", "O finalizador não está ativo")
        }
        val sessao = caixaService.resolverSessaoVenda(idUsuario, titulo.idFilial, request.idCaixaSessao)
        val aplicacoes = montarAplicacoes(parcelas, request, titulo.moeda, titulo.usdPyg, titulo.brlPyg)
        val saldosApos = titulo.parcelas.associate { it.id to it.saldo }.toMutableMap()
        for (ap in aplicacoes) saldosApos[ap.idParcela] = ap.saldoRestante
        val statusTitulo = statusTituloApos(titulo.parcelas, saldosApos)
        repository.baixarPagarLote(
            aplicacoes = aplicacoes,
            comum = BaixaNova(
                idParcela = aplicacoes.first().idParcela,
                idFinalizador = request.idFinalizador,
                idCaixaSessao = sessao.sessao.id,
                moeda = request.moeda,
                valor = request.valor,
                valorPyg = aplicacoes.sumOf { it.valorPyg },
                idUsuario = idUsuario,
                observacao = request.observacao?.trim()?.ifBlank { null },
                tipoMovimento = "pagamento",
            ),
            idTitulo = titulo.id,
            statusTitulo = statusTitulo,
        )
        return buscarPagar(titulo.id, idUsuario)
    }

    private fun resolverIdsParcelas(request: BaixaTituloRequest): List<Long> {
        val ids = (request.idsParcelas + listOfNotNull(request.idParcela)).distinct()
        if (ids.isEmpty()) throw invalido("BAIXA_SEM_PARCELA", "Selecione ao menos uma parcela")
        return ids
    }

    private fun montarAplicacoes(
        parcelas: List<ParcelaPersistida>,
        request: BaixaTituloRequest,
        moedaTitulo: Moeda,
        usdPyg: Double,
        brlPyg: Double,
    ): List<BaixaParcelaAplicacao> {
        val desconto = if (request.desconto.isNaN()) 0.0 else request.desconto
        val acrescimo = if (request.acrescimo.isNaN()) 0.0 else request.acrescimo
        if (desconto < -0.0000001 || acrescimo < -0.0000001) {
            throw invalido("BAIXA_AJUSTE_INVALIDO", "Desconto e acréscimo não podem ser negativos")
        }
        val saldoSelecionado = parcelas.sumOf { it.saldo }
        val temAjuste = desconto > 0.0000001 || acrescimo > 0.0000001
        if (!temAjuste) {
            if (request.valor <= 0) throw invalido("BAIXA_VALOR_INVALIDO", "O valor da baixa deve ser maior que zero")
            val saldoPyg = parcelas.sumOf { pygDoSaldo(it) }
            val valorPyg = paraPygTravado(request.valor, request.moeda, usdPyg, brlPyg)
            val tol = toleranciaPyg(usdPyg, brlPyg)
            val mesmaMoeda = request.moeda == moedaTitulo
            if (mesmaMoeda && request.valor > saldoSelecionado + 0.009) {
                throw invalido("BAIXA_MAIOR_SALDO", "O valor da baixa não pode exceder o saldo das parcelas selecionadas")
            }
            if (!mesmaMoeda && valorPyg > saldoPyg + tol) {
                throw invalido("BAIXA_MAIOR_SALDO", "O valor da baixa não pode exceder o saldo das parcelas selecionadas")
            }
            if (!mesmaMoeda && abs(valorPyg - saldoPyg) <= tol) {
                return ratearQuitacao(parcelas, request.valor, 0.0, 0.0, request.moeda, usdPyg, brlPyg)
            }
            return ratearFifo(parcelas, request.valor, request.moeda, moedaTitulo, usdPyg, brlPyg)
        }
        val tol = toleranciaPyg(usdPyg, brlPyg)
        val saldoPyg = parcelas.sumOf { pygDoSaldo(it) }
        val valorPyg = paraPygTravado(max(0.0, request.valor), request.moeda, usdPyg, brlPyg)
        val descontoPyg = paraPygTravado(desconto, request.moeda, usdPyg, brlPyg)
        val acrescimoPyg = paraPygTravado(acrescimo, request.moeda, usdPyg, brlPyg)
        if (descontoPyg > saldoPyg + tol) {
            throw invalido("BAIXA_DESCONTO_MAIOR", "O desconto não pode exceder o saldo")
        }
        val quitaPyg = valorPyg + descontoPyg - acrescimoPyg
        if (abs(quitaPyg - saldoPyg) > tol) {
            throw invalido("BAIXA_VALOR_AJUSTE", "Com desconto ou acréscimo, o valor tem de quitar o saldo selecionado")
        }
        if (request.valor < -0.0000001) {
            throw invalido("BAIXA_VALOR_INVALIDO", "O valor da baixa deve ser maior que zero")
        }
        return ratearQuitacao(parcelas, max(0.0, request.valor), desconto, acrescimo, request.moeda, usdPyg, brlPyg)
    }

    private fun toleranciaPyg(usdPyg: Double, brlPyg: Double): Double =
        max(1.0, max(usdPyg, brlPyg) * 0.02)

    private fun pygDoSaldo(p: ParcelaPersistida): Double =
        if (p.valor <= 0.0) 0.0 else round(p.saldo * (p.valorPyg / p.valor))

    private fun ratearQuitacao(
        parcelas: List<ParcelaPersistida>,
        valor: Double,
        desconto: Double,
        acrescimo: Double,
        moeda: Moeda,
        usdPyg: Double,
        brlPyg: Double,
    ): List<BaixaParcelaAplicacao> {
        val saldoTotal = parcelas.sumOf { it.saldo }
        var valorRest = valor
        var descRest = desconto
        var acrRest = acrescimo
        val linhas = parcelas.mapIndexed { i, p ->
            val ultimo = i == parcelas.lastIndex
            val v: Double
            val d: Double
            val a: Double
            if (ultimo || saldoTotal <= 0.0) {
                v = valorRest
                d = descRest
                a = acrRest
            } else {
                val peso = p.saldo / saldoTotal
                v = arredondarMoeda(valor * peso, moeda)
                d = arredondarMoeda(desconto * peso, moeda)
                a = arredondarMoeda(acrescimo * peso, moeda)
                valorRest = arredondarMoeda(valorRest - v, moeda)
                descRest = arredondarMoeda(descRest - d, moeda)
                acrRest = arredondarMoeda(acrRest - a, moeda)
            }
            BaixaParcelaAplicacao(
                idParcela = p.id,
                valor = v,
                valorPyg = paraPygTravado(v, moeda, usdPyg, brlPyg),
                desconto = d,
                descontoPyg = paraPygTravado(d, moeda, usdPyg, brlPyg),
                acrescimo = a,
                acrescimoPyg = paraPygTravado(a, moeda, usdPyg, brlPyg),
                saldoRestante = 0.0,
                statusParcela = StatusParcela.PAGA,
            )
        }.toMutableList()
        if (linhas.isNotEmpty()) {
            val alvoValor = paraPygTravado(valor, moeda, usdPyg, brlPyg)
            val alvoDesc = paraPygTravado(desconto, moeda, usdPyg, brlPyg)
            val alvoAcr = paraPygTravado(acrescimo, moeda, usdPyg, brlPyg)
            val last = linhas.last()
            linhas[linhas.lastIndex] = last.copy(
                valorPyg = last.valorPyg + (alvoValor - linhas.sumOf { it.valorPyg }),
                descontoPyg = last.descontoPyg + (alvoDesc - linhas.sumOf { it.descontoPyg }),
                acrescimoPyg = last.acrescimoPyg + (alvoAcr - linhas.sumOf { it.acrescimoPyg }),
            )
        }
        return linhas
    }

    private fun ratearFifo(
        parcelas: List<ParcelaPersistida>,
        valorPago: Double,
        moedaBaixa: Moeda,
        moedaTitulo: Moeda,
        usdPyg: Double,
        brlPyg: Double,
    ): List<BaixaParcelaAplicacao> {
        if (moedaBaixa != moedaTitulo) {
            return ratearFifoConvertido(parcelas, valorPago, moedaBaixa, moedaTitulo, usdPyg, brlPyg)
        }
        var restante = valorPago
        val out = mutableListOf<BaixaParcelaAplicacao>()
        for (p in parcelas) {
            if (restante <= 0.009) break
            val aplica = arredondarMoeda(minOf(restante, p.saldo), moedaTitulo)
            if (aplica <= 0) continue
            val saldoRestante = arredondarMoeda(p.saldo - aplica, moedaTitulo)
            out += BaixaParcelaAplicacao(
                idParcela = p.id,
                valor = aplica,
                valorPyg = paraPygTravado(aplica, moedaBaixa, usdPyg, brlPyg),
                saldoRestante = if (saldoRestante <= 0.009) 0.0 else saldoRestante,
                statusParcela = if (saldoRestante <= 0.009) StatusParcela.PAGA else StatusParcela.PARCIAL,
            )
            restante = arredondarMoeda(restante - aplica, moedaTitulo)
        }
        return out
    }

    private fun ratearFifoConvertido(
        parcelas: List<ParcelaPersistida>,
        valorPago: Double,
        moedaBaixa: Moeda,
        moedaTitulo: Moeda,
        usdPyg: Double,
        brlPyg: Double,
    ): List<BaixaParcelaAplicacao> {
        val pygPago = paraPygTravado(valorPago, moedaBaixa, usdPyg, brlPyg)
        if (pygPago <= 0.0) return emptyList()
        var restantePyg = pygPago
        var caixaRestante = valorPago
        val out = mutableListOf<BaixaParcelaAplicacao>()
        for (p in parcelas) {
            if (restantePyg <= 0.5) break
            val saldoPyg = pygDoSaldo(p)
            if (saldoPyg <= 0.5) continue
            val aplicaPyg = minOf(restantePyg, saldoPyg)
            val quita = aplicaPyg >= saldoPyg - 0.5
            val aplicaTitulo = if (quita) p.saldo else arredondarMoeda(p.saldo * (aplicaPyg / saldoPyg), moedaTitulo)
            val saldoBruto = arredondarMoeda(p.saldo - aplicaTitulo, moedaTitulo)
            val saldoRestante = if (quita || saldoBruto <= 0.009) 0.0 else saldoBruto
            val fechaCaixa = restantePyg - aplicaPyg <= 0.5
            val caixa = if (fechaCaixa) caixaRestante else arredondarMoeda(valorPago * (aplicaPyg / pygPago), moedaBaixa)
            caixaRestante = arredondarMoeda(max(0.0, caixaRestante - caixa), moedaBaixa)
            restantePyg -= aplicaPyg
            out += BaixaParcelaAplicacao(
                idParcela = p.id,
                valor = caixa,
                valorPyg = paraPygTravado(caixa, moedaBaixa, usdPyg, brlPyg),
                saldoRestante = saldoRestante,
                statusParcela = if (saldoRestante <= 0.009) StatusParcela.PAGA else StatusParcela.PARCIAL,
            )
        }
        if (out.isNotEmpty() && caixaRestante <= 0.009) {
            val alvoPyg = paraPygTravado(valorPago, moedaBaixa, usdPyg, brlPyg)
            val last = out.last()
            out[out.lastIndex] = last.copy(valorPyg = last.valorPyg + (alvoPyg - out.sumOf { it.valorPyg }))
        }
        return out
    }

    private fun statusTituloApos(
        parcelas: List<ParcelaPersistida>,
        saldosApos: Map<Long, Double>,
    ): StatusTitulo {
        val todosPagos = parcelas.all { (saldosApos[it.id] ?: it.saldo) <= 0.009 }
        if (todosPagos) return StatusTitulo.QUITADO
        val algumPago = parcelas.any { p ->
            val saldo = saldosApos[p.id] ?: p.saldo
            saldo < p.valor - 0.009 || saldo < p.saldo - 0.009
        }
        return if (algumPago) StatusTitulo.PARCIAL else StatusTitulo.ABERTO
    }

    fun montarParcelas(
        config: ParcelasConfigRequest,
        valor: Double,
        valorPyg: Double,
        moeda: Moeda,
        dataBase: LocalDate,
    ) = run {
        if (config.quantidade < 1 || config.quantidade > 120) {
            throw invalido("PARCELAS_QTD", "Informe entre 1 e 120 parcelas")
        }
        if (config.modoVencimento == ModoVencimento.DIA_FIXO) {
            val dia = config.diaVencimento
                ?: throw invalido("DIA_VENCIMENTO_OBRIGATORIO", "Informe o dia de vencimento")
            if (dia !in 1..28) {
                throw invalido("DIA_VENCIMENTO_INVALIDO", "O dia de vencimento deve ser entre 1 e 28")
            }
        }
        GeradorParcelas.gerar(
            valorTotal = valor,
            valorTotalPyg = valorPyg,
            quantidade = config.quantidade,
            dataBase = dataBase,
            modo = config.modoVencimento,
            diaVencimento = config.diaVencimento,
            moeda = moeda,
        )
    }

    private suspend fun validarCliente(idCliente: Long, idFilial: Long) {
        val cliente = papelService.buscarCliente(idCliente)
        if (cliente.status != Status.ATIVO) throw invalido("CLIENTE_INATIVO", "O cliente não está ativo")
        val vinculado = cliente.idFilialCadastro == idFilial || cliente.filiaisVinculadas.any { it.id == idFilial }
        if (!vinculado) throw invalido("CLIENTE_FILIAL", "O cliente não pertence a esta filial")
    }

    private suspend fun validarFornecedor(idFornecedor: Long, idFilial: Long) {
        val fornecedor = papelService.buscarFornecedor(idFornecedor)
        if (fornecedor.status != Status.ATIVO) throw invalido("FORNECEDOR_INATIVO", "O fornecedor não está ativo")
        val vinculado = fornecedor.idFilialCadastro == idFilial || fornecedor.filiaisVinculadas.any { it.id == idFilial }
        if (!vinculado) throw invalido("FORNECEDOR_FILIAL", "O fornecedor não pertence a esta filial")
    }

    private fun hoje(): LocalDate = LocalDate.now(zoneId)

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

    fun paraPyg(valor: Double, moeda: Moeda, cotacao: CotacaoResponse): Double =
        paraPygTravado(valor, moeda, cotacao.usdPyg, cotacao.brlPyg)

    fun paraPygTravado(valor: Double, moeda: Moeda, usdPyg: Double, brlPyg: Double): Double {
        val bruto = when (moeda) {
            Moeda.USD -> valor * usdPyg
            Moeda.BRL -> valor * brlPyg
            Moeda.PYG -> valor
        }
        return round(bruto)
    }

    private fun arredondarMoeda(valor: Double, moeda: Moeda): Double =
        if (moeda == Moeda.PYG) round(valor) else round(valor * 100.0) / 100.0

    private fun TituloReceberCompleto.toResumo() = TituloReceberResumoResponse(
        id = id,
        idFilial = idFilial,
        idCliente = idCliente,
        clienteNome = clienteNome,
        origem = origem,
        idVenda = idVenda,
        moeda = moeda,
        valor = valor,
        valorPyg = valorPyg,
        saldoPyg = parcelas.sumOf { p ->
            if (p.valor <= 0) 0.0 else p.saldo * (p.valorPyg / p.valor)
        },
        criadoEm = criadoEm,
        status = status,
        proximoVencimento = parcelas.filter { it.saldo > 0 }.minByOrNull { it.vencimento }?.vencimento,
    )

    private fun TituloPagarCompleto.toResumo() = TituloPagarResumoResponse(
        id = id,
        idFilial = idFilial,
        idFornecedor = idFornecedor,
        fornecedorNome = fornecedorNome,
        origem = origem,
        moeda = moeda,
        valor = valor,
        valorPyg = valorPyg,
        saldoPyg = parcelas.sumOf { p ->
            if (p.valor <= 0) 0.0 else p.saldo * (p.valorPyg / p.valor)
        },
        criadoEm = criadoEm,
        status = status,
        proximoVencimento = parcelas.filter { it.saldo > 0 }.minByOrNull { it.vencimento }?.vencimento,
    )

    private fun TituloReceberCompleto.toParcelasReceber(): List<RelatorioParcelaResponse> =
        parcelas.filter { it.status != StatusParcela.CANCELADA }.map { p ->
            val das = baixas.filter { it.idParcela == p.id }
            p.toLinha(id, clienteNome, idVenda, moeda, usdPyg, brlPyg, criadoEm, das)
        }

    private fun TituloPagarCompleto.toParcelasPagar(): List<RelatorioParcelaResponse> =
        parcelas.filter { it.status != StatusParcela.CANCELADA }.map { p ->
            val das = baixas.filter { it.idParcela == p.id }
            p.toLinha(id, fornecedorNome, null, moeda, usdPyg, brlPyg, criadoEm, das)
        }

    private fun ParcelaPersistida.toLinha(
        idTitulo: Long,
        pessoaNome: String,
        idDocumento: Long?,
        moeda: Moeda,
        usdPyg: Double,
        brlPyg: Double,
        criadoEm: Long,
        baixas: List<BaixaPersistida>,
    ) = RelatorioParcelaResponse(
        id = id,
        idTitulo = idTitulo,
        numero = numero,
        vencimento = vencimento,
        criadoEm = criadoEm,
        pessoaNome = pessoaNome,
        idDocumento = idDocumento,
        moeda = moeda,
        usdPyg = usdPyg,
        brlPyg = brlPyg,
        valor = valor,
        valorPyg = valorPyg,
        saldo = saldo,
        saldoPyg = if (valor <= 0.0) 0.0 else saldo * (valorPyg / valor),
        recebidoPyg = baixas.sumOf { it.valorPyg },
        descontoPyg = baixas.sumOf { it.descontoPyg },
        acrescimoPyg = baixas.sumOf { it.acrescimoPyg },
        status = status,
    )

    private fun BaixaRelatorioLinha.toRelatorio() = BaixaRelatorioResponse(
        id = id,
        criadoEm = criadoEm,
        pessoaNome = pessoaNome,
        moeda = moeda,
        valor = valor,
        valorPyg = valorPyg,
        desconto = desconto,
        descontoPyg = descontoPyg,
        acrescimo = acrescimo,
        acrescimoPyg = acrescimoPyg,
        finalizadorNome = finalizadorNome,
    )

    private fun TituloReceberCompleto.toResponse() = TituloReceberResponse(
        id = id,
        idFilial = idFilial,
        filialNome = filialNome,
        idCliente = idCliente,
        clienteNome = clienteNome,
        origem = origem,
        idVenda = idVenda,
        moeda = moeda,
        valor = valor,
        valorPyg = valorPyg,
        idCotacao = idCotacao,
        usdPyg = usdPyg,
        brlPyg = brlPyg,
        observacao = observacao,
        criadoEm = criadoEm,
        status = status,
        parcelas = parcelas.map { it.toResponse() },
        baixas = baixas.map { it.toResponse() },
    )

    private fun TituloPagarCompleto.toResponse() = TituloPagarResponse(
        id = id,
        idFilial = idFilial,
        filialNome = filialNome,
        idFornecedor = idFornecedor,
        fornecedorNome = fornecedorNome,
        origem = origem,
        moeda = moeda,
        valor = valor,
        valorPyg = valorPyg,
        idCotacao = idCotacao,
        usdPyg = usdPyg,
        brlPyg = brlPyg,
        observacao = observacao,
        criadoEm = criadoEm,
        status = status,
        parcelas = parcelas.map { it.toResponse() },
        baixas = baixas.map { it.toResponse() },
    )

    private fun ParcelaPersistida.toResponse() = ParcelaResponse(
        id = id,
        numero = numero,
        vencimento = vencimento,
        valor = valor,
        valorPyg = valorPyg,
        saldo = saldo,
        status = status,
    )

    private fun BaixaPersistida.toResponse() = BaixaResponse(
        id = id,
        idParcela = idParcela,
        idFinalizador = idFinalizador,
        finalizadorNome = finalizadorNome,
        idCaixaSessao = idCaixaSessao,
        moeda = moeda,
        valor = valor,
        valorPyg = valorPyg,
        desconto = desconto,
        descontoPyg = descontoPyg,
        acrescimo = acrescimo,
        acrescimoPyg = acrescimoPyg,
        criadoEm = criadoEm,
        observacao = observacao,
    )
}
