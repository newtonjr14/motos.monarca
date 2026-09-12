package com.monarca.localidade.repository

import com.monarca.JdbcCredenciais
import com.monarca.localidade.domain.Cidade
import com.monarca.localidade.domain.CidadeDetalhe
import com.monarca.localidade.domain.Divisao
import com.monarca.localidade.domain.Pais
import com.monarca.localidade.domain.TipoCidade
import com.monarca.common.enums.Status
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.singleOrNull
import kotlinx.coroutines.flow.toList
import org.jetbrains.exposed.v1.core.Op
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.neq
import org.jetbrains.exposed.v1.r2dbc.R2dbcDatabase
import org.jetbrains.exposed.v1.r2dbc.insert
import org.jetbrains.exposed.v1.r2dbc.selectAll
import org.jetbrains.exposed.v1.r2dbc.transactions.suspendTransaction
import org.jetbrains.exposed.v1.r2dbc.update
import org.slf4j.LoggerFactory

class ExposedLocalidadeRepository(
    private val database: R2dbcDatabase,
    private val jdbc: JdbcCredenciais,
) : LocalidadeRepository {
    private val log = LoggerFactory.getLogger(ExposedLocalidadeRepository::class.java)

    override suspend fun inicializar() {
        seed()
        if (jdbc.seedCidades) seedCidadesJdbc()
    }

    override suspend fun listarPaises(): List<Pais> = suspendTransaction(database) {
        PaisesTable.selectAll()
            .where { PaisesTable.status neq Status.DELETADO.name.lowercase() }
            .orderBy(PaisesTable.nome to SortOrder.ASC)
            .map { it.toPais() }
            .toList()
    }

    override suspend fun buscarPais(id: Long): Pais? = suspendTransaction(database) {
        PaisesTable.selectAll()
            .where { (PaisesTable.id eq id) and (PaisesTable.status neq Status.DELETADO.name.lowercase()) }
            .map { it.toPais() }
            .singleOrNull()
    }

    override suspend fun existePaisPorSigla(sigla: String, ignorarId: Long?): Boolean =
        suspendTransaction(database) {
            val idExistente = PaisesTable.selectAll()
                .where { (PaisesTable.sigla eq sigla) and (PaisesTable.status neq Status.DELETADO.name.lowercase()) }
                .map { it[PaisesTable.id].value }
                .singleOrNull()
            idExistente != null && idExistente != ignorarId
        }

    override suspend fun inserirPais(
        nome: String,
        sigla: String,
        usaSiglaDivisao: Boolean,
        status: Status,
    ): Long = suspendTransaction(database) {
        val inserted = PaisesTable.insert {
            it[PaisesTable.nome] = nome
            it[PaisesTable.sigla] = sigla
            it[PaisesTable.usaSiglaDivisao] = usaSiglaDivisao
            it[PaisesTable.status] = status.name.lowercase()
        }
        inserted[PaisesTable.id].value
    }

    override suspend fun atualizarPais(
        id: Long,
        nome: String,
        sigla: String,
        usaSiglaDivisao: Boolean,
        status: Status,
    ): Boolean = suspendTransaction(database) {
        PaisesTable.update({ (PaisesTable.id eq id) and (PaisesTable.status neq Status.DELETADO.name.lowercase()) }) {
            it[PaisesTable.nome] = nome
            it[PaisesTable.sigla] = sigla
            it[PaisesTable.usaSiglaDivisao] = usaSiglaDivisao
            it[PaisesTable.status] = status.name.lowercase()
        } > 0
    }

    override suspend fun excluirPais(id: Long): Boolean = suspendTransaction(database) {
        PaisesTable.update({ (PaisesTable.id eq id) and (PaisesTable.status neq Status.DELETADO.name.lowercase()) }) {
            it[status] = Status.DELETADO.name.lowercase()
        } > 0
    }

    override suspend fun contarCidadesNaoDeletadasDoPais(idPais: Long): Long = suspendTransaction(database) {
        CidadesTable
            .innerJoin(DivisoesTable)
            .selectAll()
            .where {
                (DivisoesTable.idPais eq idPais) and
                    (CidadesTable.status neq Status.DELETADO.name.lowercase()) and
                    (DivisoesTable.status neq Status.DELETADO.name.lowercase())
            }
            .map { it[CidadesTable.id].value }
            .toList()
            .size
            .toLong()
    }

    override suspend fun listarDivisoes(idPais: Long?): List<Divisao> = suspendTransaction(database) {
        DivisoesTable.selectAll()
            .where {
                val porPais = if (idPais != null) DivisoesTable.idPais eq idPais else Op.TRUE
                porPais and (DivisoesTable.status neq Status.DELETADO.name.lowercase())
            }
            .orderBy(DivisoesTable.nome to SortOrder.ASC)
            .map { it.toDivisao() }
            .toList()
    }

    override suspend fun buscarDivisao(id: Long): Divisao? = suspendTransaction(database) {
        DivisoesTable.selectAll()
            .where { (DivisoesTable.id eq id) and (DivisoesTable.status neq Status.DELETADO.name.lowercase()) }
            .map { it.toDivisao() }
            .singleOrNull()
    }

    override suspend fun existeDivisao(idPais: Long, nome: String, ignorarId: Long?): Boolean =
        suspendTransaction(database) {
            val idExistente = DivisoesTable.selectAll()
                .where {
                    (DivisoesTable.idPais eq idPais) and
                        (DivisoesTable.nome eq nome) and
                        (DivisoesTable.status neq Status.DELETADO.name.lowercase())
                }
                .map { it[DivisoesTable.id].value }
                .singleOrNull()
            idExistente != null && idExistente != ignorarId
        }

    override suspend fun inserirDivisao(nome: String, idPais: Long, sigla: String?, status: Status): Long =
        suspendTransaction(database) {
            DivisoesTable.insert {
                it[DivisoesTable.nome] = nome
                it[DivisoesTable.idPais] = idPais
                it[DivisoesTable.sigla] = sigla
                it[DivisoesTable.status] = status.name.lowercase()
            }[DivisoesTable.id].value
        }

    override suspend fun atualizarDivisao(
        id: Long,
        nome: String,
        idPais: Long,
        sigla: String?,
        status: Status,
    ): Boolean = suspendTransaction(database) {
        DivisoesTable.update({
            (DivisoesTable.id eq id) and (DivisoesTable.status neq Status.DELETADO.name.lowercase())
        }) {
            it[DivisoesTable.nome] = nome
            it[DivisoesTable.idPais] = idPais
            it[DivisoesTable.sigla] = sigla
            it[DivisoesTable.status] = status.name.lowercase()
        } > 0
    }

    override suspend fun excluirDivisao(id: Long): Boolean = suspendTransaction(database) {
        DivisoesTable.update({
            (DivisoesTable.id eq id) and (DivisoesTable.status neq Status.DELETADO.name.lowercase())
        }) {
            it[status] = Status.DELETADO.name.lowercase()
        } > 0
    }

    override suspend fun contarCidadesNaoDeletadasDaDivisao(idDivisao: Long): Long = suspendTransaction(database) {
        CidadesTable.selectAll()
            .where {
                (CidadesTable.idDivisao eq idDivisao) and
                    (CidadesTable.status neq Status.DELETADO.name.lowercase())
            }
            .map { it[CidadesTable.id].value }
            .toList()
            .size
            .toLong()
    }

    override suspend fun listarCidades(idPais: Long?, idDivisao: Long?): List<CidadeDetalhe> =
        suspendTransaction(database) {
            val rows = queryCidades()
                .where {
                    val porDivisao = if (idDivisao != null) CidadesTable.idDivisao eq idDivisao else Op.TRUE
                    val porPais = if (idPais != null) DivisoesTable.idPais eq idPais else Op.TRUE
                    porDivisao and porPais and registrosNaoDeletados()
                }
                .orderBy(CidadesTable.nome to SortOrder.ASC)
                .map { it }
                .toList()
            val nomes = rows.associate { it[CidadesTable.id].value to it[CidadesTable.nome] }
            rows.map { it.toCidadeDetalhe(nomes[it[CidadesTable.idCidadeMunicipio]]) }
        }

    override suspend fun buscarCidade(id: Long): CidadeDetalhe? = suspendTransaction(database) {
        val row = queryCidades()
            .where { (CidadesTable.id eq id) and registrosNaoDeletados() }
            .map { it }
            .toList()
            .singleOrNull()
            ?: return@suspendTransaction null
        val paiId = row[CidadesTable.idCidadeMunicipio]
        val paiNome = paiId?.let { idPai ->
            CidadesTable.selectAll()
                .where { CidadesTable.id eq idPai }
                .map { it[CidadesTable.nome] }
                .singleOrNull()
        }
        row.toCidadeDetalhe(paiNome)
    }

    override suspend fun existeCidade(
        idDivisao: Long,
        nome: String,
        idCidadeMunicipio: Long?,
        ignorarId: Long?,
    ): Boolean =
        suspendTransaction(database) {
            val idExistente = CidadesTable.selectAll()
                .where {
                    (CidadesTable.idDivisao eq idDivisao) and
                        (CidadesTable.nome eq nome) and
                        (CidadesTable.idPaiChave eq (idCidadeMunicipio ?: 0L)) and
                        (CidadesTable.status neq Status.DELETADO.name.lowercase())
                }
                .map { it[CidadesTable.id].value }
                .singleOrNull()
            idExistente != null && idExistente != ignorarId
        }

    override suspend fun contarDistritosDoMunicipio(idMunicipio: Long): Long = suspendTransaction(database) {
        CidadesTable.selectAll()
            .where {
                (CidadesTable.idCidadeMunicipio eq idMunicipio) and
                    (CidadesTable.status neq Status.DELETADO.name.lowercase())
            }
            .map { it[CidadesTable.id].value }
            .toList()
            .size
            .toLong()
    }

    override suspend fun inserirCidade(
        nome: String,
        idDivisao: Long,
        tipo: String,
        idCidadeMunicipio: Long?,
        status: Status,
    ): Long =
        suspendTransaction(database) {
            val inserted = CidadesTable.insert {
                it[CidadesTable.nome] = nome
                it[CidadesTable.idDivisao] = idDivisao
                it[CidadesTable.tipo] = tipo
                it[CidadesTable.idCidadeMunicipio] = idCidadeMunicipio
                it[CidadesTable.idPaiChave] = idCidadeMunicipio ?: 0L
                it[CidadesTable.status] = status.name.lowercase()
            }
            inserted[CidadesTable.id].value
        }

    override suspend fun atualizarCidade(
        id: Long,
        nome: String,
        idDivisao: Long,
        tipo: String,
        idCidadeMunicipio: Long?,
        status: Status,
    ): Boolean =
        suspendTransaction(database) {
            CidadesTable.update({ (CidadesTable.id eq id) and (CidadesTable.status neq Status.DELETADO.name.lowercase()) }) {
                it[CidadesTable.nome] = nome
                it[CidadesTable.idDivisao] = idDivisao
                it[CidadesTable.tipo] = tipo
                it[CidadesTable.idCidadeMunicipio] = idCidadeMunicipio
                it[CidadesTable.idPaiChave] = idCidadeMunicipio ?: 0L
                it[CidadesTable.status] = status.name.lowercase()
            } > 0
        }

    override suspend fun excluirCidade(id: Long): Boolean = suspendTransaction(database) {
        CidadesTable.update({ (CidadesTable.id eq id) and (CidadesTable.status neq Status.DELETADO.name.lowercase()) }) {
            it[status] = Status.DELETADO.name.lowercase()
        } > 0
    }

    private suspend fun seed() = suspendTransaction(database) {
        val brasilId = upsertPais("Brasil", "BR", usaSiglaDivisao = true)
        val paraguaiId = upsertPais("Paraguai", "PY", usaSiglaDivisao = false)
        ufsBrasil.forEach { upsertDivisao(brasilId, it.nome, it.sigla) }
        departamentosParaguai.forEach { upsertDivisao(paraguaiId, it.nome, it.sigla) }
    }

    private fun seedCidadesJdbc() {
        log.info("Semeando cidades (pode levar um minuto na primeira vez)...")
        java.sql.DriverManager.getConnection(jdbc.url, jdbc.user, jdbc.password).use { conn ->
            conn.autoCommit = false

            data class DivRow(val id: Long, val idPais: Long, val nome: String, val sigla: String?)
            val divisoes = mutableListOf<DivRow>()
            conn.prepareStatement("SELECT id, id_pais, nome, sigla FROM divisao WHERE status <> 'deletado'").use { ps ->
                ps.executeQuery().use { rs ->
                    while (rs.next()) {
                        divisoes += DivRow(
                            id = rs.getLong("id"),
                            idPais = rs.getLong("id_pais"),
                            nome = rs.getString("nome"),
                            sigla = rs.getString("sigla"),
                        )
                    }
                }
            }
            val paises = mutableMapOf<String, Long>()
            conn.prepareStatement("SELECT id, sigla FROM pais WHERE status <> 'deletado'").use { ps ->
                ps.executeQuery().use { rs ->
                    while (rs.next()) paises[rs.getString("sigla").uppercase()] = rs.getLong("id")
                }
            }
            val brasilId = paises["BR"] ?: run { conn.rollback(); return }
            val paraguaiId = paises["PY"] ?: run { conn.rollback(); return }
            val brPorSigla = divisoes.filter { it.idPais == brasilId }
                .associate { (it.sigla ?: "").uppercase() to it.id }
            val pyPorNome = divisoes.filter { it.idPais == paraguaiId }
                .associate { foldNome(it.nome) to it.id }

            fun chaveCidade(nome: String, idDivisao: Long, idPai: Long) =
                foldNome(nome) + "#" + idDivisao + "#" + idPai

            fun carregarExistentes(): MutableMap<String, Long> {
                val mapa = mutableMapOf<String, Long>()
                conn.prepareStatement(
                    "SELECT id, id_divisao, nome, COALESCE(id_cidade_municipio, 0) AS pai FROM cidade WHERE status <> 'deletado'",
                ).use { ps ->
                    ps.executeQuery().use { rs ->
                        while (rs.next()) {
                            mapa[chaveCidade(rs.getString("nome"), rs.getLong("id_divisao"), rs.getLong("pai"))] =
                                rs.getLong("id")
                        }
                    }
                }
                return mapa
            }

            var existentes = carregarExistentes()
            conn.prepareStatement(
                "INSERT INTO cidade (id_divisao, nome, tipo, id_cidade_municipio, id_pai_chave, status) VALUES (?, ?, 'municipio', NULL, 0, 'ativo')",
            ).use { insert ->
                var lote = 0
                fun flush() {
                    if (lote == 0) return
                    insert.executeBatch()
                    lote = 0
                }
                fun oferecer(idDivisao: Long, nome: String) {
                    val chave = chaveCidade(nome, idDivisao, 0)
                    if (existentes.containsKey(chave)) return
                    insert.setLong(1, idDivisao)
                    insert.setString(2, nome)
                    insert.addBatch()
                    lote++
                    existentes[chave] = -1
                    if (lote >= 500) flush()
                }
                for (m in lerMunicipiosBr()) {
                    val idDivisao = brPorSigla[m.chaveDivisao.uppercase()] ?: continue
                    oferecer(idDivisao, m.nome)
                }
                for (m in lerMunicipiosPy()) {
                    val idDivisao = pyPorNome[foldNome(m.chaveDivisao)] ?: continue
                    oferecer(idDivisao, m.nome)
                }
                flush()
            }
            existentes = carregarExistentes()
            conn.prepareStatement(
                "INSERT INTO cidade (id_divisao, nome, tipo, id_cidade_municipio, id_pai_chave, status) VALUES (?, ?, 'distrito', ?, ?, 'ativo')",
            ).use { insert ->
                var lote = 0
                fun flush() {
                    if (lote == 0) return
                    insert.executeBatch()
                    lote = 0
                }
                for (d in lerDistritosBr()) {
                    val idDivisao = brPorSigla[d.chaveDivisao.uppercase()] ?: continue
                    if (foldNome(d.nome) == foldNome(d.municipio)) continue
                    val idMunicipio = existentes[chaveCidade(d.municipio, idDivisao, 0)] ?: continue
                    val chaveDist = chaveCidade(d.nome, idDivisao, idMunicipio)
                    if (existentes.containsKey(chaveDist)) continue
                    insert.setLong(1, idDivisao)
                    insert.setString(2, d.nome)
                    insert.setLong(3, idMunicipio)
                    insert.setLong(4, idMunicipio)
                    insert.addBatch()
                    lote++
                    existentes[chaveDist] = -1
                    if (lote >= 500) flush()
                }
                flush()
            }
            conn.commit()
        }
        log.info("Cidades prontas")
    }

    private suspend fun upsertPais(nome: String, sigla: String, usaSiglaDivisao: Boolean): Long {
        val existente = PaisesTable.selectAll()
            .where { PaisesTable.sigla eq sigla }
            .map { it[PaisesTable.id].value }
            .singleOrNull()
        if (existente != null) {
            PaisesTable.update({ PaisesTable.id eq existente }) {
                it[PaisesTable.nome] = nome
                it[PaisesTable.usaSiglaDivisao] = usaSiglaDivisao
            }
            return existente
        }

        val inserted = PaisesTable.insert {
            it[PaisesTable.nome] = nome
            it[PaisesTable.sigla] = sigla
            it[PaisesTable.usaSiglaDivisao] = usaSiglaDivisao
            it[status] = Status.ATIVO.name.lowercase()
        }
        return inserted[PaisesTable.id].value
    }

    private suspend fun upsertDivisao(idPais: Long, nome: String, sigla: String?) {
        val existente = DivisoesTable.selectAll()
            .where { (DivisoesTable.idPais eq idPais) and (DivisoesTable.nome eq nome) }
            .map { it[DivisoesTable.id].value }
            .singleOrNull()
        if (existente != null) {
            DivisoesTable.update({ DivisoesTable.id eq existente }) {
                it[DivisoesTable.sigla] = sigla
            }
            return
        }

        DivisoesTable.insert {
            it[DivisoesTable.idPais] = idPais
            it[DivisoesTable.nome] = nome
            it[DivisoesTable.sigla] = sigla
            it[status] = Status.ATIVO.name.lowercase()
        }
    }

    private fun queryCidades() = CidadesTable
        .innerJoin(DivisoesTable)
        .innerJoin(PaisesTable)
        .selectAll()

    private fun registrosNaoDeletados() =
        (CidadesTable.status neq Status.DELETADO.name.lowercase()) and
            (DivisoesTable.status neq Status.DELETADO.name.lowercase()) and
            (PaisesTable.status neq Status.DELETADO.name.lowercase())

    private fun ResultRow.toPais() = Pais(
        id = this[PaisesTable.id].value,
        nome = this[PaisesTable.nome],
        sigla = this[PaisesTable.sigla],
        usaSiglaDivisao = this[PaisesTable.usaSiglaDivisao],
        status = Status.valueOf(this[PaisesTable.status].uppercase()),
    )

    private fun ResultRow.toDivisao() = Divisao(
        id = this[DivisoesTable.id].value,
        idPais = this[DivisoesTable.idPais].value,
        nome = this[DivisoesTable.nome],
        sigla = this[DivisoesTable.sigla],
        status = Status.valueOf(this[DivisoesTable.status].uppercase()),
    )

    private fun ResultRow.toCidade() = Cidade(
        id = this[CidadesTable.id].value,
        idDivisao = this[CidadesTable.idDivisao].value,
        nome = this[CidadesTable.nome],
        tipo = TipoCidade.valueOf(this[CidadesTable.tipo].uppercase()),
        idCidadeMunicipio = this[CidadesTable.idCidadeMunicipio],
        status = Status.valueOf(this[CidadesTable.status].uppercase()),
    )

    private fun ResultRow.toCidadeDetalhe(municipioNome: String? = null) = CidadeDetalhe(
        cidade = toCidade(),
        divisao = toDivisao(),
        pais = toPais(),
        municipioNome = municipioNome,
    )
}
