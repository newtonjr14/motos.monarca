package com.monarca.pessoa.repository

import com.monarca.common.enums.Status
import com.monarca.empresa.repository.FiliaisTable
import com.monarca.localidade.repository.PaisesTable
import com.monarca.pessoa.domain.DocumentoTipo
import com.monarca.pessoa.domain.FilialVinculo
import com.monarca.pessoa.domain.PapelCompleto
import com.monarca.pessoa.domain.Pessoa
import com.monarca.pessoa.domain.PessoaCompleta
import com.monarca.pessoa.domain.PessoaDocumento
import com.monarca.pessoa.domain.PessoaDocumentoDetalhe
import com.monarca.pessoa.domain.PessoaEndereco
import com.monarca.pessoa.domain.TipoEndereco
import com.monarca.pessoa.domain.TipoPessoa
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.singleOrNull
import kotlinx.coroutines.flow.toList
import org.jetbrains.exposed.v1.core.JoinType
import org.jetbrains.exposed.v1.core.Op
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.inList
import org.jetbrains.exposed.v1.core.isNull
import org.jetbrains.exposed.v1.core.neq
import org.jetbrains.exposed.v1.r2dbc.R2dbcDatabase
import org.jetbrains.exposed.v1.r2dbc.deleteWhere
import org.jetbrains.exposed.v1.r2dbc.insert
import org.jetbrains.exposed.v1.r2dbc.selectAll
import org.jetbrains.exposed.v1.r2dbc.transactions.suspendTransaction
import org.jetbrains.exposed.v1.r2dbc.update

class ExposedPessoaRepository(
    private val database: R2dbcDatabase,
) : PessoaRepository {

    override suspend fun inicializar() {
        seedTipos()
    }

    override suspend fun listarTipos(idPais: Long?, tipoPessoa: TipoPessoa?): List<DocumentoTipo> =
        suspendTransaction(database) {
            DocumentoTiposTable.selectAll()
                .where {
                    val porPais = if (idPais != null) DocumentoTiposTable.idPais eq idPais else Op.TRUE
                    val porTipo =
                        if (tipoPessoa != null) DocumentoTiposTable.tipoPessoa eq tipoPessoa.name.lowercase()
                        else Op.TRUE
                    porPais and porTipo
                }
                .orderBy(DocumentoTiposTable.nome to SortOrder.ASC)
                .map { it.toTipo() }
                .toList()
        }

    override suspend fun buscarTipo(id: Long): DocumentoTipo? = suspendTransaction(database) {
        DocumentoTiposTable.selectAll()
            .where { DocumentoTiposTable.id eq id }
            .map { it.toTipo() }
            .singleOrNull()
    }

    override suspend fun inserirTipo(tipo: DocumentoTipo): Long = suspendTransaction(database) {
        DocumentoTiposTable.insert {
            it[idPais] = tipo.idPais
            it[DocumentoTiposTable.tipoPessoa] = tipo.tipoPessoa.name.lowercase()
            it[codigo] = tipo.codigo
            it[nome] = tipo.nome
            it[unico] = tipo.unico
        }[DocumentoTiposTable.id].value
    }

    override suspend fun atualizarTipo(id: Long, tipo: DocumentoTipo): Boolean = suspendTransaction(database) {
        DocumentoTiposTable.update({ DocumentoTiposTable.id eq id }) {
            it[idPais] = tipo.idPais
            it[DocumentoTiposTable.tipoPessoa] = tipo.tipoPessoa.name.lowercase()
            it[codigo] = tipo.codigo
            it[nome] = tipo.nome
            it[unico] = tipo.unico
        } > 0
    }

    override suspend fun excluirTipo(id: Long): Boolean = suspendTransaction(database) {
        DocumentoTiposTable.deleteWhere { DocumentoTiposTable.id eq id } > 0
    }

    override suspend fun tipoEmUso(id: Long): Boolean = suspendTransaction(database) {
        PessoaDocumentosTable.selectAll()
            .where {
                (PessoaDocumentosTable.idTipoDocumento eq id) and
                    (PessoaDocumentosTable.status neq Status.DELETADO.name.lowercase())
            }
            .map { it[PessoaDocumentosTable.id] }
            .toList()
            .isNotEmpty()
    }

    override suspend fun listarPessoas(): List<PessoaCompleta> = suspendTransaction(database) {
        val pessoas = PessoasTable.selectAll()
            .where { PessoasTable.status neq Status.DELETADO.name.lowercase() }
            .orderBy(PessoasTable.nomeRazaoSocial to SortOrder.ASC)
            .map { it.toPessoa() }
            .toList()
        completar(pessoas)
    }

    override suspend fun buscarPessoa(id: Long): PessoaCompleta? = suspendTransaction(database) {
        val pessoa = PessoasTable.selectAll()
            .where { (PessoasTable.id eq id) and (PessoasTable.status neq Status.DELETADO.name.lowercase()) }
            .map { it.toPessoa() }
            .singleOrNull()
            ?: return@suspendTransaction null
        completar(listOf(pessoa)).first()
    }

    override suspend fun inserirPessoa(
        pessoa: Pessoa,
        documentos: List<DocumentoNovo>,
        enderecos: List<EnderecoNovo>,
    ): Long =
        suspendTransaction(database) {
            val id = PessoasTable.insert {
                it[nomeRazaoSocial] = pessoa.nomeRazaoSocial
                it[tipoPessoa] = pessoa.tipoPessoa.name.lowercase()
                it[ddi] = pessoa.ddi
                it[telefone] = pessoa.telefone
                it[email] = pessoa.email
                it[status] = pessoa.status.name.lowercase()
            }[PessoasTable.id].value
            inserirDocumentos(id, documentos)
            inserirEnderecos(id, enderecos)
            id
        }

    override suspend fun atualizarPessoa(
        id: Long,
        pessoa: Pessoa,
        documentos: List<DocumentoNovo>,
        enderecos: List<EnderecoNovo>,
    ): Boolean =
        suspendTransaction(database) {
            val updated = PessoasTable.update({
                (PessoasTable.id eq id) and (PessoasTable.status neq Status.DELETADO.name.lowercase())
            }) {
                it[nomeRazaoSocial] = pessoa.nomeRazaoSocial
                it[tipoPessoa] = pessoa.tipoPessoa.name.lowercase()
                it[ddi] = pessoa.ddi
                it[telefone] = pessoa.telefone
                it[email] = pessoa.email
                it[status] = pessoa.status.name.lowercase()
            }
            if (updated == 0) return@suspendTransaction false
            PessoaDocumentosTable.update({
                (PessoaDocumentosTable.idPessoa eq id) and
                    (PessoaDocumentosTable.status neq Status.DELETADO.name.lowercase())
            }) {
                it[status] = Status.DELETADO.name.lowercase()
            }
            inserirDocumentos(id, documentos)
            substituirEnderecos(id, enderecos)
            true
        }

    override suspend fun excluirPessoa(id: Long): Boolean = suspendTransaction(database) {
        val updated = PessoasTable.update({
            (PessoasTable.id eq id) and (PessoasTable.status neq Status.DELETADO.name.lowercase())
        }) {
            it[status] = Status.DELETADO.name.lowercase()
        }
        if (updated == 0) return@suspendTransaction false
        PessoaDocumentosTable.update({ PessoaDocumentosTable.idPessoa eq id }) {
            it[status] = Status.DELETADO.name.lowercase()
        }
        PessoaEnderecosTable.update({ PessoaEnderecosTable.idPessoa eq id }) {
            it[status] = Status.DELETADO.name.lowercase()
            it[principal] = false
            it[idPessoaPrincipal] = null
        }
        true
    }

    override suspend fun buscarPessoaPorTipoUnico(
        idTipoDocumento: Long,
        numero: String,
        ignorarPessoaId: Long?,
    ): Pessoa? = suspendTransaction(database) {
        val idPessoa = PessoaDocumentosTable.selectAll()
            .where {
                (PessoaDocumentosTable.idTipoDocumento eq idTipoDocumento) and
                    (PessoaDocumentosTable.numero eq numero) and
                    (PessoaDocumentosTable.status neq Status.DELETADO.name.lowercase())
            }
            .map { it[PessoaDocumentosTable.idPessoa].value }
            .toList()
            .firstOrNull { it != ignorarPessoaId }
            ?: return@suspendTransaction null
        PessoasTable.selectAll()
            .where { (PessoasTable.id eq idPessoa) and (PessoasTable.status neq Status.DELETADO.name.lowercase()) }
            .map { it.toPessoa() }
            .singleOrNull()
    }

    override suspend fun buscarPessoaPorDocumentoLivre(
        idPais: Long,
        tipoLivre: String,
        numero: String,
        ignorarPessoaId: Long?,
    ): Pessoa? = suspendTransaction(database) {
        val idPessoa = PessoaDocumentosTable.selectAll()
            .where {
                    (PessoaDocumentosTable.idPais eq idPais) and
                    (PessoaDocumentosTable.tipoLivre eq tipoLivre) and
                    (PessoaDocumentosTable.numero eq numero) and
                    PessoaDocumentosTable.idTipoDocumento.isNull() and
                    (PessoaDocumentosTable.status neq Status.DELETADO.name.lowercase())
            }
            .map { it[PessoaDocumentosTable.idPessoa].value }
            .toList()
            .firstOrNull { it != ignorarPessoaId }
            ?: return@suspendTransaction null
        PessoasTable.selectAll()
            .where { (PessoasTable.id eq idPessoa) and (PessoasTable.status neq Status.DELETADO.name.lowercase()) }
            .map { it.toPessoa() }
            .singleOrNull()
    }

    override suspend fun listarClientes(idFilial: Long?, filtrarPorFilial: Boolean): List<PapelCompleto> =
        listarPapeis(clientesPapel, idFilial, filtrarPorFilial)

    override suspend fun buscarCliente(id: Long): PapelCompleto? = buscarPapel(clientesPapel, id)

    override suspend fun buscarClientePorPessoa(idPessoa: Long): PapelCompleto? =
        buscarPapelPorPessoa(clientesPapel, idPessoa)

    override suspend fun inserirCliente(idPessoa: Long, status: Status, idFilialCadastro: Long): Long =
        inserirPapel(clientesPapel, idPessoa, status, idFilialCadastro)

    override suspend fun atualizarCliente(id: Long, status: Status): Boolean =
        atualizarPapel(clientesPapel, id, status)

    override suspend fun excluirCliente(id: Long, idFilial: Long?): Boolean =
        excluirPapel(clientesPapel, id, idFilial)

    override suspend fun contarClientes(): Long = contarPapeis(clientesPapel)

    override suspend fun vincularClienteFilial(idCliente: Long, idFilial: Long): Boolean =
        vincularFilial(clientesPapel, idCliente, idFilial)

    override suspend fun existeVinculoClienteFilial(idCliente: Long, idFilial: Long): Boolean =
        existeVinculoFilial(clientesPapel, idCliente, idFilial)

    override suspend fun listarFiliaisDoCliente(idCliente: Long): List<FilialVinculo> =
        listarFiliaisVinculadas(clientesPapel, idCliente)

    override suspend fun listarFornecedores(idFilial: Long?, filtrarPorFilial: Boolean): List<PapelCompleto> =
        listarPapeis(fornecedoresPapel, idFilial, filtrarPorFilial)

    override suspend fun buscarFornecedor(id: Long): PapelCompleto? = buscarPapel(fornecedoresPapel, id)

    override suspend fun buscarFornecedorPorPessoa(idPessoa: Long): PapelCompleto? =
        buscarPapelPorPessoa(fornecedoresPapel, idPessoa)

    override suspend fun inserirFornecedor(idPessoa: Long, status: Status, idFilialCadastro: Long): Long =
        inserirPapel(fornecedoresPapel, idPessoa, status, idFilialCadastro)

    override suspend fun atualizarFornecedor(id: Long, status: Status): Boolean =
        atualizarPapel(fornecedoresPapel, id, status)

    override suspend fun excluirFornecedor(id: Long, idFilial: Long?): Boolean =
        excluirPapel(fornecedoresPapel, id, idFilial)

    override suspend fun contarFornecedores(): Long = contarPapeis(fornecedoresPapel)

    override suspend fun vincularFornecedorFilial(idFornecedor: Long, idFilial: Long): Boolean =
        vincularFilial(fornecedoresPapel, idFornecedor, idFilial)

    override suspend fun existeVinculoFornecedorFilial(idFornecedor: Long, idFilial: Long): Boolean =
        existeVinculoFilial(fornecedoresPapel, idFornecedor, idFilial)

    override suspend fun listarFiliaisDoFornecedor(idFornecedor: Long): List<FilialVinculo> =
        listarFiliaisVinculadas(fornecedoresPapel, idFornecedor)

    private data class PapelSchema(
        val table: org.jetbrains.exposed.v1.core.dao.id.LongIdTable,
        val idPessoa: org.jetbrains.exposed.v1.core.Column<org.jetbrains.exposed.v1.core.dao.id.EntityID<Long>>,
        val idFilialCadastro: org.jetbrains.exposed.v1.core.Column<org.jetbrains.exposed.v1.core.dao.id.EntityID<Long>?>,
        val status: org.jetbrains.exposed.v1.core.Column<String>,
        val vinculoTable: org.jetbrains.exposed.v1.core.dao.id.LongIdTable,
        val vinculoIdPapel: org.jetbrains.exposed.v1.core.Column<org.jetbrains.exposed.v1.core.dao.id.EntityID<Long>>,
        val vinculoIdFilial: org.jetbrains.exposed.v1.core.Column<org.jetbrains.exposed.v1.core.dao.id.EntityID<Long>>,
        val vinculoStatus: org.jetbrains.exposed.v1.core.Column<String>,
    )

    private val clientesPapel = PapelSchema(
        ClientesTable,
        ClientesTable.idPessoa,
        ClientesTable.idFilialCadastro,
        ClientesTable.status,
        ClienteFilialTable,
        ClienteFilialTable.idCliente,
        ClienteFilialTable.idFilial,
        ClienteFilialTable.status,
    )
    private val fornecedoresPapel = PapelSchema(
        FornecedoresTable,
        FornecedoresTable.idPessoa,
        FornecedoresTable.idFilialCadastro,
        FornecedoresTable.status,
        FornecedorFilialTable,
        FornecedorFilialTable.idFornecedor,
        FornecedorFilialTable.idFilial,
        FornecedorFilialTable.status,
    )

    private fun queryPapeis(schema: PapelSchema) = schema.table
        .innerJoin(PessoasTable)
        .join(FiliaisTable, JoinType.LEFT, schema.idFilialCadastro, FiliaisTable.id)
        .selectAll()

    private suspend fun listarPapeis(
        schema: PapelSchema,
        idFilial: Long?,
        filtrarPorFilial: Boolean,
    ): List<PapelCompleto> = suspendTransaction(database) {
        val filtrar = filtrarPorFilial && idFilial != null
        val rows = if (filtrar) {
            schema.table
                .innerJoin(PessoasTable)
                .innerJoin(schema.vinculoTable)
                .join(FiliaisTable, JoinType.LEFT, schema.idFilialCadastro, FiliaisTable.id)
                .selectAll()
                .where {
                    (schema.vinculoIdFilial eq idFilial!!) and
                        (schema.vinculoStatus neq Status.DELETADO.name.lowercase()) and
                        (schema.status neq Status.DELETADO.name.lowercase()) and
                        (PessoasTable.status neq Status.DELETADO.name.lowercase())
                }
                .orderBy(PessoasTable.nomeRazaoSocial to SortOrder.ASC)
                .toList()
        } else {
            queryPapeis(schema)
                .where {
                    (schema.status neq Status.DELETADO.name.lowercase()) and
                        (PessoasTable.status neq Status.DELETADO.name.lowercase())
                }
                .orderBy(PessoasTable.nomeRazaoSocial to SortOrder.ASC)
                .toList()
        }
        if (rows.isEmpty()) return@suspendTransaction emptyList()
        val pessoas = completar(rows.map { it.toPessoa() }).associateBy { it.pessoa.id }
        val idsPapel = rows.map { it[schema.table.id].value }
        val filiaisPorPapel = if (idsPapel.isEmpty()) {
            emptyMap()
        } else {
            schema.vinculoTable
                .innerJoin(FiliaisTable)
                .selectAll()
                .where {
                    (schema.vinculoIdPapel inList idsPapel) and
                        (schema.vinculoStatus neq Status.DELETADO.name.lowercase()) and
                        (FiliaisTable.status neq Status.DELETADO.name.lowercase())
                }
                .map {
                    it[schema.vinculoIdPapel].value to FilialVinculo(
                        id = it[FiliaisTable.id].value,
                        nome = it[FiliaisTable.nome],
                    )
                }
                .toList()
                .groupBy({ it.first }, { it.second })
        }
        rows.map { row ->
            val idPapel = row[schema.table.id].value
            row.toPapelCompleto(
                schema,
                pessoas.getValue(row[schema.idPessoa].value),
                filiaisPorPapel[idPapel].orEmpty(),
            )
        }
    }

    private suspend fun buscarPapel(schema: PapelSchema, id: Long): PapelCompleto? = suspendTransaction(database) {
        val row = queryPapeis(schema)
            .where {
                (schema.table.id eq id) and
                    (schema.status neq Status.DELETADO.name.lowercase()) and
                    (PessoasTable.status neq Status.DELETADO.name.lowercase())
            }
            .toList()
            .singleOrNull()
            ?: return@suspendTransaction null
        val pessoa = completar(listOf(row.toPessoa())).first()
        val idPapel = row[schema.table.id].value
        val filiais = schema.vinculoTable
            .innerJoin(FiliaisTable)
            .selectAll()
            .where {
                (schema.vinculoIdPapel eq idPapel) and
                    (schema.vinculoStatus neq Status.DELETADO.name.lowercase()) and
                    (FiliaisTable.status neq Status.DELETADO.name.lowercase())
            }
            .orderBy(FiliaisTable.nome to SortOrder.ASC)
            .map { FilialVinculo(id = it[FiliaisTable.id].value, nome = it[FiliaisTable.nome]) }
            .toList()
        row.toPapelCompleto(schema, pessoa, filiais)
    }

    private suspend fun buscarPapelPorPessoa(schema: PapelSchema, idPessoa: Long): PapelCompleto? =
        suspendTransaction(database) {
            val row = schema.table.innerJoin(PessoasTable)
                .join(FiliaisTable, JoinType.LEFT, schema.idFilialCadastro, FiliaisTable.id)
                .selectAll()
                .where {
                    (schema.idPessoa eq idPessoa) and
                        (PessoasTable.status neq Status.DELETADO.name.lowercase())
                }
                .toList()
                .singleOrNull()
                ?: return@suspendTransaction null
            val pessoa = completar(listOf(row.toPessoa())).first()
            val idPapel = row[schema.table.id].value
            val filiais = schema.vinculoTable
                .innerJoin(FiliaisTable)
                .selectAll()
                .where {
                    (schema.vinculoIdPapel eq idPapel) and
                        (schema.vinculoStatus neq Status.DELETADO.name.lowercase()) and
                        (FiliaisTable.status neq Status.DELETADO.name.lowercase())
                }
                .orderBy(FiliaisTable.nome to SortOrder.ASC)
                .map { FilialVinculo(id = it[FiliaisTable.id].value, nome = it[FiliaisTable.nome]) }
                .toList()
            row.toPapelCompleto(schema, pessoa, filiais)
        }

    private suspend fun inserirPapel(
        schema: PapelSchema,
        idPessoa: Long,
        status: Status,
        idFilialCadastro: Long,
    ): Long = suspendTransaction(database) {
        val id = schema.table.insert {
            it[schema.idPessoa] = idPessoa
            it[schema.idFilialCadastro] = idFilialCadastro
            it[schema.status] = status.name.lowercase()
        }[schema.table.id].value
        vincularFilialInterno(schema, id, idFilialCadastro)
        id
    }

    private suspend fun atualizarPapel(
        schema: PapelSchema,
        id: Long,
        status: Status,
    ): Boolean = suspendTransaction(database) {
        schema.table.update({
            (schema.table.id eq id) and (schema.status neq Status.DELETADO.name.lowercase())
        }) {
            it[schema.status] = status.name.lowercase()
        } > 0
    }

    private suspend fun excluirPapel(schema: PapelSchema, id: Long, idFilial: Long?): Boolean =
        suspendTransaction(database) {
            if (idFilial != null) {
                schema.vinculoTable.update({
                    (schema.vinculoIdPapel eq id) and
                        (schema.vinculoIdFilial eq idFilial) and
                        (schema.vinculoStatus neq Status.DELETADO.name.lowercase())
                }) {
                    it[schema.vinculoStatus] = Status.DELETADO.name.lowercase()
                } > 0
            } else {
                schema.vinculoTable.update({
                    (schema.vinculoIdPapel eq id) and (schema.vinculoStatus neq Status.DELETADO.name.lowercase())
                }) {
                    it[schema.vinculoStatus] = Status.DELETADO.name.lowercase()
                }
                schema.table.update({
                    (schema.table.id eq id) and (schema.status neq Status.DELETADO.name.lowercase())
                }) {
                    it[schema.status] = Status.DELETADO.name.lowercase()
                } > 0
            }
        }

    private suspend fun vincularFilial(schema: PapelSchema, idPapel: Long, idFilial: Long): Boolean =
        suspendTransaction(database) {
            vincularFilialInterno(schema, idPapel, idFilial)
            true
        }

    private suspend fun vincularFilialInterno(schema: PapelSchema, idPapel: Long, idFilial: Long) {
        val existente = schema.vinculoTable.selectAll()
            .where {
                (schema.vinculoIdPapel eq idPapel) and (schema.vinculoIdFilial eq idFilial)
            }
            .toList()
            .singleOrNull()
        if (existente != null) {
            if (existente[schema.vinculoStatus] == Status.DELETADO.name.lowercase()) {
                schema.vinculoTable.update({ schema.vinculoTable.id eq existente[schema.vinculoTable.id].value }) {
                    it[schema.vinculoStatus] = Status.ATIVO.name.lowercase()
                }
            }
            return
        }
        schema.vinculoTable.insert {
            it[schema.vinculoIdPapel] = idPapel
            it[schema.vinculoIdFilial] = idFilial
            it[schema.vinculoStatus] = Status.ATIVO.name.lowercase()
        }
    }

    private suspend fun existeVinculoFilial(schema: PapelSchema, idPapel: Long, idFilial: Long): Boolean =
        suspendTransaction(database) {
            schema.vinculoTable.selectAll()
                .where {
                    (schema.vinculoIdPapel eq idPapel) and
                        (schema.vinculoIdFilial eq idFilial) and
                        (schema.vinculoStatus neq Status.DELETADO.name.lowercase())
                }
                .toList()
                .isNotEmpty()
        }

    private suspend fun listarFiliaisVinculadas(schema: PapelSchema, idPapel: Long): List<FilialVinculo> =
        suspendTransaction(database) {
            schema.vinculoTable
                .innerJoin(FiliaisTable)
                .selectAll()
                .where {
                    (schema.vinculoIdPapel eq idPapel) and
                        (schema.vinculoStatus neq Status.DELETADO.name.lowercase()) and
                        (FiliaisTable.status neq Status.DELETADO.name.lowercase())
                }
                .orderBy(FiliaisTable.nome to SortOrder.ASC)
                .map {
                    FilialVinculo(
                        id = it[FiliaisTable.id].value,
                        nome = it[FiliaisTable.nome],
                    )
                }
                .toList()
        }

    private suspend fun contarPapeis(schema: PapelSchema): Long = suspendTransaction(database) {
        schema.table.innerJoin(PessoasTable).selectAll()
            .where {
                (schema.status neq Status.DELETADO.name.lowercase()) and
                    (PessoasTable.status neq Status.DELETADO.name.lowercase())
            }
            .map { it[schema.table.id].value }
            .toList()
            .size
            .toLong()
    }

    private suspend fun seedTipos() = suspendTransaction(database) {
        val br = paisId("BR") ?: return@suspendTransaction
        val py = paisId("PY") ?: return@suspendTransaction
        upsertTipo(br, TipoPessoa.FISICA, "CPF", "CPF", unico = true)
        upsertTipo(br, TipoPessoa.JURIDICA, "CNPJ", "CNPJ", unico = true)
        upsertTipo(py, TipoPessoa.FISICA, "CI", "Cédula de identidad", unico = true)
        upsertTipo(py, TipoPessoa.JURIDICA, "RUC", "RUC", unico = true)
    }

    private suspend fun paisId(sigla: String): Long? =
        PaisesTable.selectAll()
            .where { PaisesTable.sigla eq sigla }
            .map { it[PaisesTable.id].value }
            .singleOrNull()

    private suspend fun upsertTipo(
        idPais: Long,
        tipoPessoa: TipoPessoa,
        codigo: String,
        nome: String,
        unico: Boolean,
    ) {
        val existente = DocumentoTiposTable.selectAll()
            .where { (DocumentoTiposTable.idPais eq idPais) and (DocumentoTiposTable.codigo eq codigo) }
            .map { it[DocumentoTiposTable.id].value }
            .singleOrNull()
        if (existente != null) {
            DocumentoTiposTable.update({ DocumentoTiposTable.id eq existente }) {
                it[DocumentoTiposTable.tipoPessoa] = tipoPessoa.name.lowercase()
                it[DocumentoTiposTable.nome] = nome
                it[DocumentoTiposTable.unico] = unico
            }
            return
        }
        DocumentoTiposTable.insert {
            it[DocumentoTiposTable.idPais] = idPais
            it[DocumentoTiposTable.tipoPessoa] = tipoPessoa.name.lowercase()
            it[DocumentoTiposTable.codigo] = codigo
            it[DocumentoTiposTable.nome] = nome
            it[DocumentoTiposTable.unico] = unico
        }
    }

    private suspend fun inserirDocumentos(idPessoa: Long, documentos: List<DocumentoNovo>) {
        documentos.forEach { doc ->
            PessoaDocumentosTable.insert {
                it[PessoaDocumentosTable.idPessoa] = idPessoa
                it[idPais] = doc.idPais
                it[idTipoDocumento] = doc.idTipoDocumento
                it[tipoLivre] = doc.tipoLivre
                it[numero] = doc.numero
                it[status] = Status.ATIVO.name.lowercase()
            }
        }
    }

    private suspend fun substituirEnderecos(idPessoa: Long, enderecos: List<EnderecoNovo>) {
        PessoaEnderecosTable.update({
            (PessoaEnderecosTable.idPessoa eq idPessoa) and
                (PessoaEnderecosTable.status neq Status.DELETADO.name.lowercase())
        }) {
            it[status] = Status.DELETADO.name.lowercase()
            it[principal] = false
            it[idPessoaPrincipal] = null
        }
        inserirEnderecos(idPessoa, enderecos)
    }

    private suspend fun inserirEnderecos(idPessoa: Long, enderecos: List<EnderecoNovo>) {
        enderecos.forEach { endereco ->
            PessoaEnderecosTable.insert {
                it[PessoaEnderecosTable.idPessoa] = idPessoa
                it[tipo] = endereco.tipo.name.lowercase()
                it[principal] = endereco.principal
                it[tipoLogradouro] = endereco.tipoLogradouro
                it[logradouro] = endereco.logradouro
                it[numero] = endereco.numero
                it[bairro] = endereco.bairro
                it[cep] = endereco.cep
                it[complemento] = endereco.complemento
                it[idCidade] = endereco.idCidade
                it[status] = Status.ATIVO.name.lowercase()
                it[idPessoaPrincipal] = if (endereco.principal) idPessoa else null
            }
        }
    }

    private suspend fun completar(pessoas: List<Pessoa>): List<PessoaCompleta> {
        if (pessoas.isEmpty()) return emptyList()
        val ids = pessoas.map { it.id }
        val docs = PessoaDocumentosTable
            .innerJoin(PaisesTable)
            .join(
                DocumentoTiposTable,
                JoinType.LEFT,
                PessoaDocumentosTable.idTipoDocumento,
                DocumentoTiposTable.id,
            )
            .selectAll()
            .where {
                (PessoaDocumentosTable.idPessoa inList ids) and
                    (PessoaDocumentosTable.status neq Status.DELETADO.name.lowercase())
            }
            .map { it.toDocumentoDetalhe() }
            .toList()
            .groupBy { it.documento.idPessoa }
        val enderecos = PessoaEnderecosTable.selectAll()
            .where {
                (PessoaEnderecosTable.idPessoa inList ids) and
                    (PessoaEnderecosTable.status neq Status.DELETADO.name.lowercase())
            }
            .orderBy(
                PessoaEnderecosTable.principal to SortOrder.DESC,
                PessoaEnderecosTable.id to SortOrder.ASC,
            )
            .map { it.toEndereco() }
            .toList()
            .groupBy { it.idPessoa }
        return pessoas.map { PessoaCompleta(it, docs[it.id].orEmpty(), enderecos[it.id].orEmpty()) }
    }

    private fun ResultRow.toTipo() = DocumentoTipo(
        id = this[DocumentoTiposTable.id].value,
        idPais = this[DocumentoTiposTable.idPais].value,
        tipoPessoa = TipoPessoa.valueOf(this[DocumentoTiposTable.tipoPessoa].uppercase()),
        codigo = this[DocumentoTiposTable.codigo],
        nome = this[DocumentoTiposTable.nome],
        unico = this[DocumentoTiposTable.unico],
    )

    private fun ResultRow.toPapelCompleto(
        schema: PapelSchema,
        pessoa: PessoaCompleta,
        filiaisVinculadas: List<FilialVinculo>,
    ) = PapelCompleto(
        id = this[schema.table.id].value,
        idPessoa = this[schema.idPessoa].value,
        idFilialCadastro = this[schema.idFilialCadastro]?.value,
        filialNome = getOrNull(FiliaisTable.nome),
        filiaisVinculadas = filiaisVinculadas,
        status = Status.valueOf(this[schema.status].uppercase()),
        pessoa = pessoa,
    )

    private fun ResultRow.toPessoa() = Pessoa(
        id = this[PessoasTable.id].value,
        nomeRazaoSocial = this[PessoasTable.nomeRazaoSocial],
        tipoPessoa = TipoPessoa.valueOf(this[PessoasTable.tipoPessoa].uppercase()),
        ddi = this[PessoasTable.ddi],
        telefone = this[PessoasTable.telefone],
        email = this[PessoasTable.email],
        status = Status.valueOf(this[PessoasTable.status].uppercase()),
    )

    private fun ResultRow.toEndereco() = PessoaEndereco(
        id = this[PessoaEnderecosTable.id].value,
        idPessoa = this[PessoaEnderecosTable.idPessoa].value,
        tipo = TipoEndereco.valueOf(this[PessoaEnderecosTable.tipo].uppercase()),
        principal = this[PessoaEnderecosTable.principal],
        tipoLogradouro = this[PessoaEnderecosTable.tipoLogradouro],
        logradouro = this[PessoaEnderecosTable.logradouro],
        numero = this[PessoaEnderecosTable.numero],
        bairro = this[PessoaEnderecosTable.bairro],
        cep = this[PessoaEnderecosTable.cep],
        complemento = this[PessoaEnderecosTable.complemento],
        idCidade = this[PessoaEnderecosTable.idCidade]?.value,
        status = Status.valueOf(this[PessoaEnderecosTable.status].uppercase()),
    )

    private fun ResultRow.toDocumentoDetalhe(): PessoaDocumentoDetalhe {
        val tipo = this.getOrNull(DocumentoTiposTable.id)?.let { toTipo() }
        return PessoaDocumentoDetalhe(
            documento = PessoaDocumento(
                id = this[PessoaDocumentosTable.id].value,
                idPessoa = this[PessoaDocumentosTable.idPessoa].value,
                idPais = this[PessoaDocumentosTable.idPais].value,
                idTipoDocumento = this[PessoaDocumentosTable.idTipoDocumento]?.value,
                tipoLivre = this[PessoaDocumentosTable.tipoLivre],
                numero = this[PessoaDocumentosTable.numero],
            ),
            tipo = tipo,
            paisSigla = this[PaisesTable.sigla],
            paisNome = this[PaisesTable.nome],
        )
    }
}
