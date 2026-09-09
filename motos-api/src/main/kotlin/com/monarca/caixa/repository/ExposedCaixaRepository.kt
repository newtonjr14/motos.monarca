package com.monarca.caixa.repository

import com.monarca.audit.domain.AuditAction
import com.monarca.audit.repository.gravarAuditLog
import com.monarca.caixa.domain.Caixa
import com.monarca.caixa.domain.CaixaAcesso
import com.monarca.caixa.domain.CaixaMovimentacao
import com.monarca.caixa.domain.CaixaSessao
import com.monarca.caixa.domain.Finalizador
import com.monarca.caixa.domain.StatusSessaoCaixa
import com.monarca.caixa.domain.TipoFinalizador
import com.monarca.caixa.domain.TipoMovimentacaoCaixa
import com.monarca.caixa.domain.ValorFinalizador
import com.monarca.common.enums.Status
import com.monarca.empresa.repository.FiliaisTable
import com.monarca.produto.domain.Moeda
import com.monarca.usuario.repository.UsuarioFiliaisTable
import com.monarca.usuario.repository.UsuariosTable
import com.monarca.venda.repository.VendaNegociacoesTable
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.singleOrNull
import kotlinx.coroutines.flow.toList
import org.jetbrains.exposed.v1.core.JoinType
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.inList
import org.jetbrains.exposed.v1.core.neq
import org.jetbrains.exposed.v1.r2dbc.R2dbcDatabase
import org.jetbrains.exposed.v1.r2dbc.insert
import org.jetbrains.exposed.v1.r2dbc.selectAll
import org.jetbrains.exposed.v1.r2dbc.transactions.suspendTransaction
import org.jetbrains.exposed.v1.r2dbc.update

class ExposedCaixaRepository(
    private val database: R2dbcDatabase,
) : CaixaRepository {

    override suspend fun listarFinalizadores(): List<Finalizador> = suspendTransaction(database) {
        FinalizadoresTable.selectAll()
            .where { FinalizadoresTable.status neq Status.DELETADO.name.lowercase() }
            .orderBy(FinalizadoresTable.nome to SortOrder.ASC)
            .map { it.toFinalizador() }
            .toList()
    }

    override suspend fun buscarFinalizador(id: Long): Finalizador? = suspendTransaction(database) {
        FinalizadoresTable.selectAll()
            .where { (FinalizadoresTable.id eq id) and (FinalizadoresTable.status neq Status.DELETADO.name.lowercase()) }
            .map { it.toFinalizador() }
            .singleOrNull()
    }

    override suspend fun existeFinalizadorNome(nome: String, ignorarId: Long?): Boolean =
        suspendTransaction(database) {
            val idExistente = FinalizadoresTable.selectAll()
                .where {
                    (FinalizadoresTable.nome eq nome) and
                        (FinalizadoresTable.status neq Status.DELETADO.name.lowercase())
                }
                .map { it[FinalizadoresTable.id].value }
                .singleOrNull()
            idExistente != null && idExistente != ignorarId
        }

    override suspend fun inserirFinalizador(item: Finalizador): Long = suspendTransaction(database) {
        val inserted = FinalizadoresTable.insert {
            it[nome] = item.nome
            it[tipo] = item.tipo.name.lowercase()
            it[status] = item.status.name.lowercase()
        }
        val id = inserted[FinalizadoresTable.id].value
        gravarAuditLog("finalizador", id.toString(), AuditAction.INSERT, newValues = """{"nome":"${item.nome}"}""")
        id
    }

    override suspend fun atualizarFinalizador(id: Long, item: Finalizador): Boolean = suspendTransaction(database) {
        FinalizadoresTable.update({
            (FinalizadoresTable.id eq id) and (FinalizadoresTable.status neq Status.DELETADO.name.lowercase())
        }) {
            it[nome] = item.nome
            it[tipo] = item.tipo.name.lowercase()
            it[status] = item.status.name.lowercase()
        } > 0
    }

    override suspend fun excluirFinalizador(id: Long): Boolean = suspendTransaction(database) {
        FinalizadoresTable.update({
            (FinalizadoresTable.id eq id) and (FinalizadoresTable.status neq Status.DELETADO.name.lowercase())
        }) {
            it[status] = Status.DELETADO.name.lowercase()
        } > 0
    }

    override suspend fun finalizadorEmUso(id: Long): Boolean = suspendTransaction(database) {
        CaixaMovimentacaoFinalizadoresTable.selectAll()
            .where { CaixaMovimentacaoFinalizadoresTable.idFinalizador eq id }
            .toList()
            .isNotEmpty() ||
            VendaNegociacoesTable.selectAll()
                .where { VendaNegociacoesTable.idFinalizador eq id }
                .toList()
                .isNotEmpty()
    }

    override suspend fun listarCaixas(idFilial: Long): List<CaixaDetalhe> = suspendTransaction(database) {
        queryCaixas()
            .where { (CaixasTable.idFilial eq idFilial) and (CaixasTable.status neq Status.DELETADO.name.lowercase()) }
            .orderBy(CaixasTable.nome to SortOrder.ASC)
            .map { it.toCaixaDetalhe() }
            .toList()
    }

    override suspend fun buscarCaixa(id: Long): CaixaDetalhe? = suspendTransaction(database) {
        queryCaixas()
            .where { (CaixasTable.id eq id) and (CaixasTable.status neq Status.DELETADO.name.lowercase()) }
            .map { it.toCaixaDetalhe() }
            .singleOrNull()
    }

    override suspend fun existeCaixaNome(idFilial: Long, nome: String, ignorarId: Long?): Boolean =
        suspendTransaction(database) {
            val idExistente = CaixasTable.selectAll()
                .where {
                    (CaixasTable.idFilial eq idFilial) and
                        (CaixasTable.nome eq nome) and
                        (CaixasTable.status neq Status.DELETADO.name.lowercase())
                }
                .map { it[CaixasTable.id].value }
                .singleOrNull()
            idExistente != null && idExistente != ignorarId
        }

    override suspend fun inserirCaixa(caixa: Caixa): Long = suspendTransaction(database) {
        val inserted = CaixasTable.insert {
            it[idFilial] = caixa.idFilial
            it[nome] = caixa.nome
            it[status] = caixa.status.name.lowercase()
        }
        val id = inserted[CaixasTable.id].value
        gravarAuditLog("caixa", id.toString(), AuditAction.INSERT, newValues = """{"nome":"${caixa.nome}"}""")
        id
    }

    override suspend fun atualizarCaixa(id: Long, caixa: Caixa): Boolean = suspendTransaction(database) {
        CaixasTable.update({
            (CaixasTable.id eq id) and (CaixasTable.status neq Status.DELETADO.name.lowercase())
        }) {
            it[idFilial] = caixa.idFilial
            it[nome] = caixa.nome
            it[status] = caixa.status.name.lowercase()
        } > 0
    }

    override suspend fun excluirCaixa(id: Long): Boolean = suspendTransaction(database) {
        UsuarioCaixasTable.update({
            (UsuarioCaixasTable.idCaixa eq id) and (UsuarioCaixasTable.status neq Status.DELETADO.name.lowercase())
        }) {
            it[status] = Status.DELETADO.name.lowercase()
        }
        CaixasTable.update({
            (CaixasTable.id eq id) and (CaixasTable.status neq Status.DELETADO.name.lowercase())
        }) {
            it[status] = Status.DELETADO.name.lowercase()
        } > 0
    }

    override suspend fun caixaTemSessao(id: Long): Boolean = suspendTransaction(database) {
        CaixaSessoesTable.selectAll()
            .where { CaixaSessoesTable.idCaixa eq id }
            .toList()
            .isNotEmpty()
    }

    override suspend fun listarAcessos(idUsuario: Long): List<CaixaAcesso> = suspendTransaction(database) {
        UsuarioCaixasTable
            .innerJoin(CaixasTable)
            .innerJoin(FiliaisTable)
            .selectAll()
            .where {
                (UsuarioCaixasTable.idUsuario eq idUsuario) and
                    (UsuarioCaixasTable.status neq Status.DELETADO.name.lowercase()) and
                    (CaixasTable.status neq Status.DELETADO.name.lowercase())
            }
            .orderBy(UsuarioCaixasTable.padrao to SortOrder.DESC, CaixasTable.nome to SortOrder.ASC)
            .map {
                CaixaAcesso(
                    id = it[CaixasTable.id].value,
                    nome = it[CaixasTable.nome],
                    idFilial = it[CaixasTable.idFilial].value,
                    filialNome = it[FiliaisTable.nome],
                    padrao = it[UsuarioCaixasTable.padrao],
                )
            }
            .toList()
    }

    override suspend fun temAcessoCaixa(idUsuario: Long, idCaixa: Long): Boolean = suspendTransaction(database) {
        UsuarioCaixasTable.selectAll()
            .where {
                (UsuarioCaixasTable.idUsuario eq idUsuario) and
                    (UsuarioCaixasTable.idCaixa eq idCaixa) and
                    (UsuarioCaixasTable.status neq Status.DELETADO.name.lowercase())
            }
            .toList()
            .isNotEmpty()
    }

    override suspend fun substituirAcessos(idUsuario: Long, idsCaixas: List<Long>, idCaixaPadrao: Long?) {
        suspendTransaction(database) {
            val atuais = UsuarioCaixasTable.selectAll()
                .where { UsuarioCaixasTable.idUsuario eq idUsuario }
                .toList()
            for (row in atuais) {
                val idCaixa = row[UsuarioCaixasTable.idCaixa].value
                if (idCaixa !in idsCaixas && row[UsuarioCaixasTable.status] != Status.DELETADO.name.lowercase()) {
                    UsuarioCaixasTable.update({ UsuarioCaixasTable.id eq row[UsuarioCaixasTable.id].value }) {
                        it[status] = Status.DELETADO.name.lowercase()
                        it[padrao] = false
                    }
                }
            }
            val porCaixa = atuais.associateBy { it[UsuarioCaixasTable.idCaixa].value }
            val padrao = idCaixaPadrao ?: idsCaixas.firstOrNull()
            for (idCaixa in idsCaixas) {
                val existente = porCaixa[idCaixa]
                if (existente == null) {
                    UsuarioCaixasTable.insert {
                        it[UsuarioCaixasTable.idUsuario] = idUsuario
                        it[UsuarioCaixasTable.idCaixa] = idCaixa
                        it[UsuarioCaixasTable.padrao] = idCaixa == padrao
                        it[status] = Status.ATIVO.name.lowercase()
                    }
                } else {
                    UsuarioCaixasTable.update({ UsuarioCaixasTable.id eq existente[UsuarioCaixasTable.id].value }) {
                        it[status] = Status.ATIVO.name.lowercase()
                        it[UsuarioCaixasTable.padrao] = idCaixa == padrao
                    }
                }
            }
        }
    }

    override suspend fun vincularUsuariosDaFilial(idCaixa: Long, idFilial: Long) {
        suspendTransaction(database) {
            val usuarios = UsuarioFiliaisTable.selectAll()
                .where {
                    (UsuarioFiliaisTable.idFilial eq idFilial) and
                        (UsuarioFiliaisTable.status neq Status.DELETADO.name.lowercase())
                }
                .map { it[UsuarioFiliaisTable.idUsuario].value }
                .toList()
                .distinct()
            for (idUsuario in usuarios) {
                val ja = UsuarioCaixasTable.selectAll()
                    .where { (UsuarioCaixasTable.idUsuario eq idUsuario) and (UsuarioCaixasTable.idCaixa eq idCaixa) }
                    .singleOrNull()
                if (ja == null) {
                    val temPadrao = UsuarioCaixasTable.selectAll()
                        .where {
                            (UsuarioCaixasTable.idUsuario eq idUsuario) and
                                (UsuarioCaixasTable.padrao eq true) and
                                (UsuarioCaixasTable.status neq Status.DELETADO.name.lowercase())
                        }
                        .toList()
                        .isNotEmpty()
                    UsuarioCaixasTable.insert {
                        it[UsuarioCaixasTable.idUsuario] = idUsuario
                        it[UsuarioCaixasTable.idCaixa] = idCaixa
                        it[padrao] = !temPadrao
                        it[status] = Status.ATIVO.name.lowercase()
                    }
                } else if (ja[UsuarioCaixasTable.status] == Status.DELETADO.name.lowercase()) {
                    UsuarioCaixasTable.update({ UsuarioCaixasTable.id eq ja[UsuarioCaixasTable.id].value }) {
                        it[status] = Status.ATIVO.name.lowercase()
                    }
                }
            }
        }
    }

    override suspend fun buscarSessaoAberta(idCaixa: Long): CaixaSessao? = suspendTransaction(database) {
        CaixaSessoesTable.selectAll()
            .where {
                (CaixaSessoesTable.idCaixa eq idCaixa) and
                    (CaixaSessoesTable.status eq StatusSessaoCaixa.ABERTO.name.lowercase())
            }
            .map { it.toSessao() }
            .singleOrNull()
    }

    override suspend fun buscarSessao(id: Long): SessaoDetalhe? = suspendTransaction(database) {
        querySessoes()
            .where { CaixaSessoesTable.id eq id }
            .map { it.toSessaoDetalhe() }
            .singleOrNull()
            ?.let { it.copy(saldos = saldosInterno(id)) }
    }

    override suspend fun listarSessoes(idCaixa: Long): List<SessaoDetalhe> = suspendTransaction(database) {
        querySessoes()
            .where { CaixaSessoesTable.idCaixa eq idCaixa }
            .orderBy(CaixaSessoesTable.abertoEm to SortOrder.DESC)
            .map { it.toSessaoDetalhe() }
            .toList()
            .map { detalhe -> detalhe.copy(saldos = saldosInterno(detalhe.sessao.id)) }
    }

    override suspend fun abrirSessao(sessao: CaixaSessao, conferencia: List<ValorFinalizador>, idUsuario: Long): Long =
        suspendTransaction(database) {
            val inserted = CaixaSessoesTable.insert {
                it[idCaixa] = sessao.idCaixa
                it[idUsuarioAbertura] = sessao.idUsuarioAbertura
                it[data] = sessao.data
                it[abertoEm] = sessao.abertoEm
                it[observacaoAbertura] = sessao.observacaoAbertura
                it[status] = StatusSessaoCaixa.ABERTO.name.lowercase()
            }
            val id = inserted[CaixaSessoesTable.id].value
            inserirMovimento(
                idSessao = id,
                tipo = TipoMovimentacaoCaixa.ABERTURA,
                idUsuario = idUsuario,
                valores = conferencia.filter { it.valor > 0 },
                observacao = sessao.observacaoAbertura,
            )
            gravarAuditLog("caixa_sessao", id.toString(), AuditAction.INSERT, newValues = """{"idCaixa":${sessao.idCaixa}}""")
            id
        }

    override suspend fun fecharSessao(
        id: Long,
        sessao: CaixaSessao,
        conferencia: List<ValorFinalizador>,
        idUsuario: Long,
    ): Boolean = suspendTransaction(database) {
        inserirMovimento(
            idSessao = id,
            tipo = TipoMovimentacaoCaixa.FECHAMENTO,
            idUsuario = idUsuario,
            valores = conferencia,
            observacao = sessao.observacaoFechamento,
        )
        CaixaSessoesTable.update({
            (CaixaSessoesTable.id eq id) and (CaixaSessoesTable.status eq StatusSessaoCaixa.ABERTO.name.lowercase())
        }) {
            it[idUsuarioFechamento] = idUsuario
            it[fechadoEm] = sessao.fechadoEm
            it[observacaoFechamento] = sessao.observacaoFechamento
            it[status] = StatusSessaoCaixa.FECHADO.name.lowercase()
        } > 0
    }

    override suspend fun transferir(
        idSessaoOrigem: Long,
        idSessaoDestino: Long,
        valores: List<ValorFinalizador>,
        idUsuario: Long,
        observacao: String?,
    ) {
        suspendTransaction(database) {
            val saida = inserirMovimento(
                idSessao = idSessaoOrigem,
                tipo = TipoMovimentacaoCaixa.TRANSFERENCIA_SAIDA,
                idUsuario = idUsuario,
                valores = valores,
                observacao = observacao,
            )
            val entrada = inserirMovimento(
                idSessao = idSessaoDestino,
                tipo = TipoMovimentacaoCaixa.TRANSFERENCIA_ENTRADA,
                idUsuario = idUsuario,
                valores = valores,
                observacao = observacao,
                idPar = saida,
            )
            CaixaMovimentacoesTable.update({ CaixaMovimentacoesTable.id eq saida }) {
                it[idMovimentacaoPar] = entrada
            }
        }
    }

    override suspend fun listarMovimentacoes(idSessao: Long): List<MovimentacaoDetalhe> = suspendTransaction(database) {
        val movimentos = CaixaMovimentacoesTable
            .innerJoin(UsuariosTable)
            .selectAll()
            .where {
                (CaixaMovimentacoesTable.idCaixaSessao eq idSessao) and
                    (CaixaMovimentacoesTable.status neq Status.DELETADO.name.lowercase())
            }
            .orderBy(CaixaMovimentacoesTable.criadoEm to SortOrder.ASC)
            .toList()
        val ids = movimentos.map { it[CaixaMovimentacoesTable.id].value }
        val fins = if (ids.isEmpty()) emptyList() else {
            CaixaMovimentacaoFinalizadoresTable
                .innerJoin(FinalizadoresTable)
                .selectAll()
                .where { CaixaMovimentacaoFinalizadoresTable.idCaixaMovimentacao inList ids }
                .toList()
        }
        val porMov = fins.groupBy { it[CaixaMovimentacaoFinalizadoresTable.idCaixaMovimentacao].value }
        movimentos.map { row ->
            val id = row[CaixaMovimentacoesTable.id].value
            val linhas = porMov[id].orEmpty()
            MovimentacaoDetalhe(
                movimento = CaixaMovimentacao(
                    id = id,
                    idCaixaSessao = row[CaixaMovimentacoesTable.idCaixaSessao].value,
                    tipo = TipoMovimentacaoCaixa.valueOf(row[CaixaMovimentacoesTable.tipo].uppercase()),
                    idUsuario = row[CaixaMovimentacoesTable.idUsuario].value,
                    idVenda = row[CaixaMovimentacoesTable.idVenda]?.value,
                    idMovimentacaoPar = row[CaixaMovimentacoesTable.idMovimentacaoPar],
                    criadoEm = row[CaixaMovimentacoesTable.criadoEm],
                    observacao = row[CaixaMovimentacoesTable.observacao],
                    status = Status.valueOf(row[CaixaMovimentacoesTable.status].uppercase()),
                    finalizadores = linhas.map {
                        ValorFinalizador(
                            idFinalizador = it[CaixaMovimentacaoFinalizadoresTable.idFinalizador].value,
                            valor = it[CaixaMovimentacaoFinalizadoresTable.valor],
                            moeda = Moeda.valueOf(it[CaixaMovimentacaoFinalizadoresTable.moeda].uppercase()),
                            valorPyg = it[CaixaMovimentacaoFinalizadoresTable.valorPyg],
                        )
                    },
                ),
                usuarioNome = row[UsuariosTable.nome],
                finalizadorNomes = linhas.associate {
                    it[CaixaMovimentacaoFinalizadoresTable.idFinalizador].value to it[FinalizadoresTable.nome]
                },
            )
        }
    }

    override suspend fun saldosSessao(idSessao: Long): List<ValorFinalizador> = suspendTransaction(database) {
        saldosInterno(idSessao)
    }

    override suspend fun registrarMovimentoVenda(
        idSessao: Long,
        idVenda: Long,
        idUsuario: Long,
        valores: List<ValorFinalizador>,
    ) {
        suspendTransaction(database) {
            inserirMovimento(
                idSessao = idSessao,
                tipo = TipoMovimentacaoCaixa.VENDA,
                idUsuario = idUsuario,
                valores = valores,
                idVenda = idVenda,
            )
        }
    }

    private fun queryCaixas() = CaixasTable
        .innerJoin(FiliaisTable)
        .selectAll()

    private fun querySessoes() = CaixaSessoesTable
        .innerJoin(CaixasTable)
        .join(UsuariosTable, JoinType.INNER, CaixaSessoesTable.idUsuarioAbertura, UsuariosTable.id)
        .selectAll()

    private suspend fun inserirMovimento(
        idSessao: Long,
        tipo: TipoMovimentacaoCaixa,
        idUsuario: Long,
        valores: List<ValorFinalizador>,
        observacao: String? = null,
        idVenda: Long? = null,
        idPar: Long? = null,
    ): Long {
        val inserted = CaixaMovimentacoesTable.insert {
            it[idCaixaSessao] = idSessao
            it[CaixaMovimentacoesTable.tipo] = tipo.name.lowercase()
            it[CaixaMovimentacoesTable.idUsuario] = idUsuario
            it[CaixaMovimentacoesTable.idVenda] = idVenda
            it[idMovimentacaoPar] = idPar
            it[criadoEm] = System.currentTimeMillis()
            it[CaixaMovimentacoesTable.observacao] = observacao
            it[status] = Status.ATIVO.name.lowercase()
        }
        val id = inserted[CaixaMovimentacoesTable.id].value
        for (linha in valores) {
            CaixaMovimentacaoFinalizadoresTable.insert {
                it[idCaixaMovimentacao] = id
                it[idFinalizador] = linha.idFinalizador
                it[moeda] = linha.moeda.name.lowercase()
                it[valor] = linha.valor
                it[valorPyg] = linha.valorPyg
            }
        }
        return id
    }

    private suspend fun saldosInterno(idSessao: Long): List<ValorFinalizador> {
        val movimentos = CaixaMovimentacoesTable.selectAll()
            .where {
                (CaixaMovimentacoesTable.idCaixaSessao eq idSessao) and
                    (CaixaMovimentacoesTable.status neq Status.DELETADO.name.lowercase())
            }
            .toList()
        val ids = movimentos.map { it[CaixaMovimentacoesTable.id].value }
        if (ids.isEmpty()) return emptyList()
        val tipoPorId = movimentos.associate {
            it[CaixaMovimentacoesTable.id].value to it[CaixaMovimentacoesTable.tipo]
        }
        val linhas = CaixaMovimentacaoFinalizadoresTable.selectAll()
            .where { CaixaMovimentacaoFinalizadoresTable.idCaixaMovimentacao inList ids }
            .toList()
        val mapa = mutableMapOf<Pair<Long, Moeda>, Pair<Double, Double>>()
        for (linha in linhas) {
            val idMov = linha[CaixaMovimentacaoFinalizadoresTable.idCaixaMovimentacao].value
            val tipo = tipoPorId[idMov] ?: continue
            if (tipo == TipoMovimentacaoCaixa.FECHAMENTO.name.lowercase()) continue
            val sinal = if (tipo == TipoMovimentacaoCaixa.TRANSFERENCIA_SAIDA.name.lowercase()) -1.0 else 1.0
            val idFin = linha[CaixaMovimentacaoFinalizadoresTable.idFinalizador].value
            val moeda = Moeda.valueOf(linha[CaixaMovimentacaoFinalizadoresTable.moeda].uppercase())
            val chave = idFin to moeda
            val atual = mapa[chave] ?: (0.0 to 0.0)
            mapa[chave] = (atual.first + sinal * linha[CaixaMovimentacaoFinalizadoresTable.valor]) to
                (atual.second + sinal * linha[CaixaMovimentacaoFinalizadoresTable.valorPyg])
        }
        return mapa.map { (chave, totais) ->
            ValorFinalizador(
                idFinalizador = chave.first,
                valor = totais.first,
                moeda = chave.second,
                valorPyg = totais.second,
            )
        }
    }

    private fun ResultRow.toFinalizador() = Finalizador(
        id = this[FinalizadoresTable.id].value,
        nome = this[FinalizadoresTable.nome],
        tipo = TipoFinalizador.valueOf(this[FinalizadoresTable.tipo].uppercase()),
        status = Status.valueOf(this[FinalizadoresTable.status].uppercase()),
    )

    private fun ResultRow.toCaixaDetalhe(): CaixaDetalhe {
        val id = this[CaixasTable.id].value
        return CaixaDetalhe(
            caixa = Caixa(
                id = id,
                idFilial = this[CaixasTable.idFilial].value,
                nome = this[CaixasTable.nome],
                status = Status.valueOf(this[CaixasTable.status].uppercase()),
            ),
            filialNome = this[FiliaisTable.nome],
            sessaoAbertaId = null,
        )
    }

    private fun ResultRow.toSessao() = CaixaSessao(
        id = this[CaixaSessoesTable.id].value,
        idCaixa = this[CaixaSessoesTable.idCaixa].value,
        idUsuarioAbertura = this[CaixaSessoesTable.idUsuarioAbertura].value,
        idUsuarioFechamento = this[CaixaSessoesTable.idUsuarioFechamento]?.value,
        data = this[CaixaSessoesTable.data],
        abertoEm = this[CaixaSessoesTable.abertoEm],
        fechadoEm = this[CaixaSessoesTable.fechadoEm],
        observacaoAbertura = this[CaixaSessoesTable.observacaoAbertura],
        observacaoFechamento = this[CaixaSessoesTable.observacaoFechamento],
        status = StatusSessaoCaixa.valueOf(this[CaixaSessoesTable.status].uppercase()),
    )

    private fun ResultRow.toSessaoDetalhe() = SessaoDetalhe(
        sessao = toSessao(),
        caixaNome = this[CaixasTable.nome],
        idFilial = this[CaixasTable.idFilial].value,
        usuarioAberturaNome = this[UsuariosTable.nome],
        saldos = emptyList(),
    )
}
