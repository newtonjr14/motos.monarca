package com.monarca.titulo.repository

import com.monarca.audit.domain.AuditAction
import com.monarca.audit.repository.gravarAuditLog
import com.monarca.caixa.domain.TipoMovimentacaoCaixa
import com.monarca.caixa.repository.CaixaMovimentacaoFinalizadoresTable
import com.monarca.caixa.repository.CaixaMovimentacoesTable
import com.monarca.caixa.repository.FinalizadoresTable
import com.monarca.common.enums.Status
import com.monarca.empresa.repository.FiliaisTable
import com.monarca.pessoa.repository.ClientesTable
import com.monarca.pessoa.repository.FornecedoresTable
import com.monarca.pessoa.repository.PessoasTable
import com.monarca.produto.domain.Moeda
import com.monarca.titulo.domain.OrigemTitulo
import com.monarca.titulo.domain.StatusParcela
import com.monarca.titulo.domain.StatusTitulo
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.singleOrNull
import kotlinx.coroutines.flow.toList
import org.jetbrains.exposed.v1.core.JoinType
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.inList
import org.jetbrains.exposed.v1.r2dbc.R2dbcDatabase
import org.jetbrains.exposed.v1.r2dbc.insert
import org.jetbrains.exposed.v1.r2dbc.selectAll
import org.jetbrains.exposed.v1.r2dbc.transactions.suspendTransaction
import org.jetbrains.exposed.v1.r2dbc.update

class ExposedTituloRepository(
    private val database: R2dbcDatabase,
) : TituloRepository {

    override suspend fun listarReceber(idFilial: Long): List<TituloReceberCompleto> = suspendTransaction(database) {
        queryReceber()
            .where { TitulosReceberTable.idFilial eq idFilial }
            .orderBy(TitulosReceberTable.criadoEm to SortOrder.DESC)
            .map { it[TitulosReceberTable.id].value }
            .toList()
            .mapNotNull { completarReceber(it) }
    }

    override suspend fun buscarReceber(id: Long): TituloReceberCompleto? = suspendTransaction(database) {
        completarReceber(id)
    }

    override suspend fun inserirReceber(titulo: TituloReceberNovo): Long = suspendTransaction(database) {
        val agora = System.currentTimeMillis()
        val inserted = TitulosReceberTable.insert {
            it[idFilial] = titulo.idFilial
            it[idCliente] = titulo.idCliente
            it[origem] = titulo.origem.name.lowercase()
            it[idVenda] = titulo.idVenda
            it[moeda] = titulo.moeda.name.lowercase()
            it[valor] = titulo.valor
            it[valorPyg] = titulo.valorPyg
            it[idCotacao] = titulo.idCotacao
            it[usdPyg] = titulo.usdPyg
            it[brlPyg] = titulo.brlPyg
            it[observacao] = titulo.observacao
            it[criadoEm] = agora
            it[status] = StatusTitulo.ABERTO.name.lowercase()
        }
        val id = inserted[TitulosReceberTable.id].value
        for (p in titulo.parcelas) {
            ParcelasReceberTable.insert {
                it[idTitulo] = id
                it[numero] = p.numero
                it[vencimento] = p.vencimento
                it[valor] = p.valor
                it[valorPyg] = p.valorPyg
                it[saldo] = p.valor
                it[status] = StatusParcela.ABERTA.name.lowercase()
            }
        }
        gravarAuditLog("titulo_receber", id.toString(), AuditAction.INSERT, newValues = """{"valor":${titulo.valor}}""")
        id
    }

    override suspend fun baixarReceber(
        baixa: BaixaNova,
        saldoRestanteParcela: Double,
        statusParcela: StatusParcela,
        statusTitulo: StatusTitulo,
    ): Long = suspendTransaction(database) {
        val agora = System.currentTimeMillis()
        val inserted = BaixasReceberTable.insert {
            it[idParcela] = baixa.idParcela
            it[idFinalizador] = baixa.idFinalizador
            it[idCaixaSessao] = baixa.idCaixaSessao
            it[moeda] = baixa.moeda.name.lowercase()
            it[valor] = baixa.valor
            it[valorPyg] = baixa.valorPyg
            it[idUsuario] = baixa.idUsuario
            it[criadoEm] = agora
            it[observacao] = baixa.observacao
            it[status] = Status.ATIVO.name.lowercase()
        }
        val idBaixa = inserted[BaixasReceberTable.id].value
        val parcela = ParcelasReceberTable.selectAll()
            .where { ParcelasReceberTable.id eq baixa.idParcela }
            .singleOrNull()!!
        ParcelasReceberTable.update({ ParcelasReceberTable.id eq baixa.idParcela }) {
            it[saldo] = saldoRestanteParcela
            it[status] = statusParcela.name.lowercase()
        }
        TitulosReceberTable.update({ TitulosReceberTable.id eq parcela[ParcelasReceberTable.idTitulo].value }) {
            it[status] = statusTitulo.name.lowercase()
        }
        val mov = CaixaMovimentacoesTable.insert {
            it[idCaixaSessao] = baixa.idCaixaSessao
            it[tipo] = TipoMovimentacaoCaixa.RECEBIMENTO.name.lowercase()
            it[idUsuario] = baixa.idUsuario
            it[idBaixaReceber] = idBaixa
            it[criadoEm] = agora
            it[observacao] = baixa.observacao
            it[status] = Status.ATIVO.name.lowercase()
        }
        val idMov = mov[CaixaMovimentacoesTable.id].value
        CaixaMovimentacaoFinalizadoresTable.insert {
            it[idCaixaMovimentacao] = idMov
            it[idFinalizador] = baixa.idFinalizador
            it[moeda] = baixa.moeda.name.lowercase()
            it[valor] = baixa.valor
            it[valorPyg] = baixa.valorPyg
        }
        gravarAuditLog("baixa_receber", idBaixa.toString(), AuditAction.INSERT, newValues = """{"valor":${baixa.valor}}""")
        idBaixa
    }

    override suspend fun baixarReceberLote(
        aplicacoes: List<BaixaParcelaAplicacao>,
        comum: BaixaNova,
        idTitulo: Long,
        statusTitulo: StatusTitulo,
    ): Unit = suspendTransaction(database) {
        val agora = System.currentTimeMillis()
        var primeiroIdBaixa: Long? = null
        for (ap in aplicacoes) {
            val inserted = BaixasReceberTable.insert {
                it[idParcela] = ap.idParcela
                it[idFinalizador] = comum.idFinalizador
                it[idCaixaSessao] = comum.idCaixaSessao
                it[moeda] = comum.moeda.name.lowercase()
                it[valor] = ap.valor
                it[valorPyg] = ap.valorPyg
                it[desconto] = ap.desconto
                it[descontoPyg] = ap.descontoPyg
                it[acrescimo] = ap.acrescimo
                it[acrescimoPyg] = ap.acrescimoPyg
                it[idUsuario] = comum.idUsuario
                it[criadoEm] = agora
                it[observacao] = comum.observacao
                it[status] = Status.ATIVO.name.lowercase()
            }
            if (primeiroIdBaixa == null) primeiroIdBaixa = inserted[BaixasReceberTable.id].value
            ParcelasReceberTable.update({ ParcelasReceberTable.id eq ap.idParcela }) {
                it[saldo] = ap.saldoRestante
                it[status] = ap.statusParcela.name.lowercase()
            }
        }
        TitulosReceberTable.update({ TitulosReceberTable.id eq idTitulo }) {
            it[status] = statusTitulo.name.lowercase()
        }
        val total = aplicacoes.sumOf { it.valor }
        val totalPyg = aplicacoes.sumOf { it.valorPyg }
        if (total > 0.0000001) {
        val mov = CaixaMovimentacoesTable.insert {
            it[idCaixaSessao] = comum.idCaixaSessao
            it[tipo] = TipoMovimentacaoCaixa.RECEBIMENTO.name.lowercase()
            it[idUsuario] = comum.idUsuario
            it[idBaixaReceber] = primeiroIdBaixa
            it[criadoEm] = agora
            it[observacao] = comum.observacao
            it[status] = Status.ATIVO.name.lowercase()
        }
        val idMov = mov[CaixaMovimentacoesTable.id].value
        CaixaMovimentacaoFinalizadoresTable.insert {
            it[idCaixaMovimentacao] = idMov
            it[idFinalizador] = comum.idFinalizador
            it[moeda] = comum.moeda.name.lowercase()
            it[valor] = total
            it[valorPyg] = totalPyg
        }
        }
        gravarAuditLog(
            "baixa_receber",
            (primeiroIdBaixa ?: 0).toString(),
            AuditAction.INSERT,
            newValues = """{"lote":true,"valor":$total}""",
        )
    }

    override suspend fun listarPagar(idFilial: Long): List<TituloPagarCompleto> = suspendTransaction(database) {
        queryPagar()
            .where { TitulosPagarTable.idFilial eq idFilial }
            .orderBy(TitulosPagarTable.criadoEm to SortOrder.DESC)
            .map { it[TitulosPagarTable.id].value }
            .toList()
            .mapNotNull { completarPagar(it) }
    }

    override suspend fun buscarPagar(id: Long): TituloPagarCompleto? = suspendTransaction(database) {
        completarPagar(id)
    }

    override suspend fun inserirPagar(titulo: TituloPagarNovo): Long = suspendTransaction(database) {
        val agora = System.currentTimeMillis()
        val inserted = TitulosPagarTable.insert {
            it[idFilial] = titulo.idFilial
            it[idFornecedor] = titulo.idFornecedor
            it[origem] = titulo.origem.name.lowercase()
            it[idEntrada] = titulo.idEntrada
            it[moeda] = titulo.moeda.name.lowercase()
            it[valor] = titulo.valor
            it[valorPyg] = titulo.valorPyg
            it[idCotacao] = titulo.idCotacao
            it[usdPyg] = titulo.usdPyg
            it[brlPyg] = titulo.brlPyg
            it[observacao] = titulo.observacao
            it[criadoEm] = agora
            it[status] = StatusTitulo.ABERTO.name.lowercase()
        }
        val id = inserted[TitulosPagarTable.id].value
        for (p in titulo.parcelas) {
            ParcelasPagarTable.insert {
                it[idTitulo] = id
                it[numero] = p.numero
                it[vencimento] = p.vencimento
                it[valor] = p.valor
                it[valorPyg] = p.valorPyg
                it[saldo] = p.valor
                it[status] = StatusParcela.ABERTA.name.lowercase()
            }
        }
        gravarAuditLog("titulo_pagar", id.toString(), AuditAction.INSERT, newValues = """{"valor":${titulo.valor}}""")
        id
    }

    override suspend fun baixarPagar(
        baixa: BaixaNova,
        saldoRestanteParcela: Double,
        statusParcela: StatusParcela,
        statusTitulo: StatusTitulo,
    ): Long = suspendTransaction(database) {
        val agora = System.currentTimeMillis()
        val inserted = BaixasPagarTable.insert {
            it[idParcela] = baixa.idParcela
            it[idFinalizador] = baixa.idFinalizador
            it[idCaixaSessao] = baixa.idCaixaSessao
            it[moeda] = baixa.moeda.name.lowercase()
            it[valor] = baixa.valor
            it[valorPyg] = baixa.valorPyg
            it[idUsuario] = baixa.idUsuario
            it[criadoEm] = agora
            it[observacao] = baixa.observacao
            it[status] = Status.ATIVO.name.lowercase()
        }
        val idBaixa = inserted[BaixasPagarTable.id].value
        val parcela = ParcelasPagarTable.selectAll()
            .where { ParcelasPagarTable.id eq baixa.idParcela }
            .singleOrNull()!!
        ParcelasPagarTable.update({ ParcelasPagarTable.id eq baixa.idParcela }) {
            it[saldo] = saldoRestanteParcela
            it[status] = statusParcela.name.lowercase()
        }
        TitulosPagarTable.update({ TitulosPagarTable.id eq parcela[ParcelasPagarTable.idTitulo].value }) {
            it[status] = statusTitulo.name.lowercase()
        }
        val mov = CaixaMovimentacoesTable.insert {
            it[idCaixaSessao] = baixa.idCaixaSessao
            it[tipo] = TipoMovimentacaoCaixa.PAGAMENTO.name.lowercase()
            it[idUsuario] = baixa.idUsuario
            it[idBaixaPagar] = idBaixa
            it[criadoEm] = agora
            it[observacao] = baixa.observacao
            it[status] = Status.ATIVO.name.lowercase()
        }
        val idMov = mov[CaixaMovimentacoesTable.id].value
        CaixaMovimentacaoFinalizadoresTable.insert {
            it[idCaixaMovimentacao] = idMov
            it[idFinalizador] = baixa.idFinalizador
            it[moeda] = baixa.moeda.name.lowercase()
            it[valor] = -baixa.valor
            it[valorPyg] = -baixa.valorPyg
        }
        gravarAuditLog("baixa_pagar", idBaixa.toString(), AuditAction.INSERT, newValues = """{"valor":${baixa.valor}}""")
        idBaixa
    }

    override suspend fun baixarPagarLote(
        aplicacoes: List<BaixaParcelaAplicacao>,
        comum: BaixaNova,
        idTitulo: Long,
        statusTitulo: StatusTitulo,
    ): Unit = suspendTransaction(database) {
        val agora = System.currentTimeMillis()
        var primeiroIdBaixa: Long? = null
        for (ap in aplicacoes) {
            val inserted = BaixasPagarTable.insert {
                it[idParcela] = ap.idParcela
                it[idFinalizador] = comum.idFinalizador
                it[idCaixaSessao] = comum.idCaixaSessao
                it[moeda] = comum.moeda.name.lowercase()
                it[valor] = ap.valor
                it[valorPyg] = ap.valorPyg
                it[desconto] = ap.desconto
                it[descontoPyg] = ap.descontoPyg
                it[acrescimo] = ap.acrescimo
                it[acrescimoPyg] = ap.acrescimoPyg
                it[idUsuario] = comum.idUsuario
                it[criadoEm] = agora
                it[observacao] = comum.observacao
                it[status] = Status.ATIVO.name.lowercase()
            }
            if (primeiroIdBaixa == null) primeiroIdBaixa = inserted[BaixasPagarTable.id].value
            ParcelasPagarTable.update({ ParcelasPagarTable.id eq ap.idParcela }) {
                it[saldo] = ap.saldoRestante
                it[status] = ap.statusParcela.name.lowercase()
            }
        }
        TitulosPagarTable.update({ TitulosPagarTable.id eq idTitulo }) {
            it[status] = statusTitulo.name.lowercase()
        }
        val total = aplicacoes.sumOf { it.valor }
        val totalPyg = aplicacoes.sumOf { it.valorPyg }
        if (total > 0.0000001) {
        val mov = CaixaMovimentacoesTable.insert {
            it[idCaixaSessao] = comum.idCaixaSessao
            it[tipo] = TipoMovimentacaoCaixa.PAGAMENTO.name.lowercase()
            it[idUsuario] = comum.idUsuario
            it[idBaixaPagar] = primeiroIdBaixa
            it[criadoEm] = agora
            it[observacao] = comum.observacao
            it[status] = Status.ATIVO.name.lowercase()
        }
        val idMov = mov[CaixaMovimentacoesTable.id].value
        CaixaMovimentacaoFinalizadoresTable.insert {
            it[idCaixaMovimentacao] = idMov
            it[idFinalizador] = comum.idFinalizador
            it[moeda] = comum.moeda.name.lowercase()
            it[valor] = -total
            it[valorPyg] = -totalPyg
        }
        }
        gravarAuditLog(
            "baixa_pagar",
            (primeiroIdBaixa ?: 0).toString(),
            AuditAction.INSERT,
            newValues = """{"lote":true,"valor":$total}""",
        )
    }

    override suspend fun buscarParcelaReceber(idParcela: Long): Pair<TituloReceberCompleto, ParcelaPersistida>? =
        suspendTransaction(database) {
            val row = ParcelasReceberTable.selectAll()
                .where { ParcelasReceberTable.id eq idParcela }
                .singleOrNull() ?: return@suspendTransaction null
            val titulo = completarReceber(row[ParcelasReceberTable.idTitulo].value) ?: return@suspendTransaction null
            val parcela = titulo.parcelas.first { it.id == idParcela }
            titulo to parcela
        }

    override suspend fun buscarParcelaPagar(idParcela: Long): Pair<TituloPagarCompleto, ParcelaPersistida>? =
        suspendTransaction(database) {
            val row = ParcelasPagarTable.selectAll()
                .where { ParcelasPagarTable.id eq idParcela }
                .singleOrNull() ?: return@suspendTransaction null
            val titulo = completarPagar(row[ParcelasPagarTable.idTitulo].value) ?: return@suspendTransaction null
            val parcela = titulo.parcelas.first { it.id == idParcela }
            titulo to parcela
        }

    private fun queryReceber() = TitulosReceberTable
        .innerJoin(FiliaisTable)
        .join(ClientesTable, JoinType.INNER, TitulosReceberTable.idCliente, ClientesTable.id)
        .join(PessoasTable, JoinType.INNER, ClientesTable.idPessoa, PessoasTable.id)
        .selectAll()

    private fun queryPagar() = TitulosPagarTable
        .innerJoin(FiliaisTable)
        .join(FornecedoresTable, JoinType.INNER, TitulosPagarTable.idFornecedor, FornecedoresTable.id)
        .join(PessoasTable, JoinType.INNER, FornecedoresTable.idPessoa, PessoasTable.id)
        .selectAll()

    private suspend fun completarReceber(id: Long): TituloReceberCompleto? {
        val row = queryReceber()
            .where { TitulosReceberTable.id eq id }
            .singleOrNull() ?: return null
        val parcelas = ParcelasReceberTable.selectAll()
            .where { ParcelasReceberTable.idTitulo eq id }
            .orderBy(ParcelasReceberTable.numero to SortOrder.ASC)
            .map {
                ParcelaPersistida(
                    id = it[ParcelasReceberTable.id].value,
                    idTitulo = id,
                    numero = it[ParcelasReceberTable.numero],
                    vencimento = it[ParcelasReceberTable.vencimento],
                    valor = it[ParcelasReceberTable.valor],
                    valorPyg = it[ParcelasReceberTable.valorPyg],
                    saldo = it[ParcelasReceberTable.saldo],
                    status = StatusParcela.valueOf(it[ParcelasReceberTable.status].uppercase()),
                )
            }
            .toList()
        val idsParcelas = parcelas.map { it.id }
        val baixas = if (idsParcelas.isEmpty()) emptyList() else {
            BaixasReceberTable
                .innerJoin(FinalizadoresTable)
                .selectAll()
                .where {
                    (BaixasReceberTable.idParcela inList idsParcelas) and
                        (BaixasReceberTable.status eq Status.ATIVO.name.lowercase())
                }
                .orderBy(BaixasReceberTable.criadoEm to SortOrder.ASC)
                .map {
                    BaixaPersistida(
                        id = it[BaixasReceberTable.id].value,
                        idParcela = it[BaixasReceberTable.idParcela].value,
                        idFinalizador = it[BaixasReceberTable.idFinalizador].value,
                        finalizadorNome = it[FinalizadoresTable.nome],
                        idCaixaSessao = it[BaixasReceberTable.idCaixaSessao].value,
                        moeda = Moeda.valueOf(it[BaixasReceberTable.moeda].uppercase()),
                        valor = it[BaixasReceberTable.valor],
                        valorPyg = it[BaixasReceberTable.valorPyg],
                        desconto = it[BaixasReceberTable.desconto],
                        descontoPyg = it[BaixasReceberTable.descontoPyg],
                        acrescimo = it[BaixasReceberTable.acrescimo],
                        acrescimoPyg = it[BaixasReceberTable.acrescimoPyg],
                        idUsuario = it[BaixasReceberTable.idUsuario].value,
                        criadoEm = it[BaixasReceberTable.criadoEm],
                        observacao = it[BaixasReceberTable.observacao],
                    )
                }
                .toList()
        }
        return TituloReceberCompleto(
            id = id,
            idFilial = row[TitulosReceberTable.idFilial].value,
            filialNome = row[FiliaisTable.nome],
            idCliente = row[TitulosReceberTable.idCliente].value,
            clienteNome = row[PessoasTable.nomeRazaoSocial],
            origem = OrigemTitulo.valueOf(row[TitulosReceberTable.origem].uppercase()),
            idVenda = row[TitulosReceberTable.idVenda]?.value,
            moeda = Moeda.valueOf(row[TitulosReceberTable.moeda].uppercase()),
            valor = row[TitulosReceberTable.valor],
            valorPyg = row[TitulosReceberTable.valorPyg],
            idCotacao = row[TitulosReceberTable.idCotacao].value,
            usdPyg = row[TitulosReceberTable.usdPyg],
            brlPyg = row[TitulosReceberTable.brlPyg],
            observacao = row[TitulosReceberTable.observacao],
            criadoEm = row[TitulosReceberTable.criadoEm],
            status = StatusTitulo.valueOf(row[TitulosReceberTable.status].uppercase()),
            parcelas = parcelas,
            baixas = baixas,
        )
    }

    private suspend fun completarPagar(id: Long): TituloPagarCompleto? {
        val row = queryPagar()
            .where { TitulosPagarTable.id eq id }
            .singleOrNull() ?: return null
        val parcelas = ParcelasPagarTable.selectAll()
            .where { ParcelasPagarTable.idTitulo eq id }
            .orderBy(ParcelasPagarTable.numero to SortOrder.ASC)
            .map {
                ParcelaPersistida(
                    id = it[ParcelasPagarTable.id].value,
                    idTitulo = id,
                    numero = it[ParcelasPagarTable.numero],
                    vencimento = it[ParcelasPagarTable.vencimento],
                    valor = it[ParcelasPagarTable.valor],
                    valorPyg = it[ParcelasPagarTable.valorPyg],
                    saldo = it[ParcelasPagarTable.saldo],
                    status = StatusParcela.valueOf(it[ParcelasPagarTable.status].uppercase()),
                )
            }
            .toList()
        val idsParcelas = parcelas.map { it.id }
        val baixas = if (idsParcelas.isEmpty()) emptyList() else {
            BaixasPagarTable
                .innerJoin(FinalizadoresTable)
                .selectAll()
                .where {
                    (BaixasPagarTable.idParcela inList idsParcelas) and
                        (BaixasPagarTable.status eq Status.ATIVO.name.lowercase())
                }
                .orderBy(BaixasPagarTable.criadoEm to SortOrder.ASC)
                .map {
                    BaixaPersistida(
                        id = it[BaixasPagarTable.id].value,
                        idParcela = it[BaixasPagarTable.idParcela].value,
                        idFinalizador = it[BaixasPagarTable.idFinalizador].value,
                        finalizadorNome = it[FinalizadoresTable.nome],
                        idCaixaSessao = it[BaixasPagarTable.idCaixaSessao].value,
                        moeda = Moeda.valueOf(it[BaixasPagarTable.moeda].uppercase()),
                        valor = it[BaixasPagarTable.valor],
                        valorPyg = it[BaixasPagarTable.valorPyg],
                        desconto = it[BaixasPagarTable.desconto],
                        descontoPyg = it[BaixasPagarTable.descontoPyg],
                        acrescimo = it[BaixasPagarTable.acrescimo],
                        acrescimoPyg = it[BaixasPagarTable.acrescimoPyg],
                        idUsuario = it[BaixasPagarTable.idUsuario].value,
                        criadoEm = it[BaixasPagarTable.criadoEm],
                        observacao = it[BaixasPagarTable.observacao],
                    )
                }
                .toList()
        }
        return TituloPagarCompleto(
            id = id,
            idFilial = row[TitulosPagarTable.idFilial].value,
            filialNome = row[FiliaisTable.nome],
            idFornecedor = row[TitulosPagarTable.idFornecedor].value,
            fornecedorNome = row[PessoasTable.nomeRazaoSocial],
            origem = OrigemTitulo.valueOf(row[TitulosPagarTable.origem].uppercase()),
            moeda = Moeda.valueOf(row[TitulosPagarTable.moeda].uppercase()),
            valor = row[TitulosPagarTable.valor],
            valorPyg = row[TitulosPagarTable.valorPyg],
            idCotacao = row[TitulosPagarTable.idCotacao].value,
            usdPyg = row[TitulosPagarTable.usdPyg],
            brlPyg = row[TitulosPagarTable.brlPyg],
            observacao = row[TitulosPagarTable.observacao],
            criadoEm = row[TitulosPagarTable.criadoEm],
            status = StatusTitulo.valueOf(row[TitulosPagarTable.status].uppercase()),
            parcelas = parcelas,
            baixas = baixas,
        )
    }
}
