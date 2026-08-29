package com.monarca.pessoa.repository

import com.monarca.common.enums.Status
import com.monarca.localidade.repository.PaisesTable
import com.monarca.pessoa.domain.DocumentoTipo
import com.monarca.pessoa.domain.PapelCompleto
import com.monarca.pessoa.domain.Pessoa
import com.monarca.pessoa.domain.PessoaCompleta
import com.monarca.pessoa.domain.PessoaDocumento
import com.monarca.pessoa.domain.PessoaDocumentoDetalhe
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

    override suspend fun inserirPessoa(pessoa: Pessoa, documentos: List<DocumentoNovo>): Long =
        suspendTransaction(database) {
            val id = PessoasTable.insert {
                it[nomeRazaoSocial] = pessoa.nomeRazaoSocial
                it[tipoPessoa] = pessoa.tipoPessoa.name.lowercase()
                it[ddi] = pessoa.ddi
                it[telefone] = pessoa.telefone
                it[email] = pessoa.email
                it[tipoLogradouro] = pessoa.tipoLogradouro
                it[logradouro] = pessoa.logradouro
                it[numero] = pessoa.numero
                it[bairro] = pessoa.bairro
                it[cep] = pessoa.cep
                it[complemento] = pessoa.complemento
                it[idCidade] = pessoa.idCidade
                it[status] = pessoa.status.name.lowercase()
            }[PessoasTable.id].value
            inserirDocumentos(id, documentos)
            id
        }

    override suspend fun atualizarPessoa(id: Long, pessoa: Pessoa, documentos: List<DocumentoNovo>): Boolean =
        suspendTransaction(database) {
            val updated = PessoasTable.update({
                (PessoasTable.id eq id) and (PessoasTable.status neq Status.DELETADO.name.lowercase())
            }) {
                it[nomeRazaoSocial] = pessoa.nomeRazaoSocial
                it[tipoPessoa] = pessoa.tipoPessoa.name.lowercase()
                it[ddi] = pessoa.ddi
                it[telefone] = pessoa.telefone
                it[email] = pessoa.email
                it[tipoLogradouro] = pessoa.tipoLogradouro
                it[logradouro] = pessoa.logradouro
                it[numero] = pessoa.numero
                it[bairro] = pessoa.bairro
                it[cep] = pessoa.cep
                it[complemento] = pessoa.complemento
                it[idCidade] = pessoa.idCidade
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

    override suspend fun listarClientes(): List<PapelCompleto> = listarPapeis(clientesPapel)

    override suspend fun buscarCliente(id: Long): PapelCompleto? = buscarPapel(clientesPapel, id)

    override suspend fun buscarClientePorPessoa(idPessoa: Long): PapelCompleto? =
        buscarPapelPorPessoa(clientesPapel, idPessoa)

    override suspend fun inserirCliente(idPessoa: Long, status: Status): Long =
        inserirPapel(clientesPapel, idPessoa, status)

    override suspend fun atualizarCliente(id: Long, status: Status): Boolean =
        atualizarPapel(clientesPapel, id, status)

    override suspend fun excluirCliente(id: Long): Boolean = excluirPapel(clientesPapel, id)

    override suspend fun contarClientes(): Long = contarPapeis(clientesPapel)

    override suspend fun listarFornecedores(): List<PapelCompleto> = listarPapeis(fornecedoresPapel)

    override suspend fun buscarFornecedor(id: Long): PapelCompleto? = buscarPapel(fornecedoresPapel, id)

    override suspend fun buscarFornecedorPorPessoa(idPessoa: Long): PapelCompleto? =
        buscarPapelPorPessoa(fornecedoresPapel, idPessoa)

    override suspend fun inserirFornecedor(idPessoa: Long, status: Status): Long =
        inserirPapel(fornecedoresPapel, idPessoa, status)

    override suspend fun atualizarFornecedor(id: Long, status: Status): Boolean =
        atualizarPapel(fornecedoresPapel, id, status)

    override suspend fun excluirFornecedor(id: Long): Boolean = excluirPapel(fornecedoresPapel, id)

    override suspend fun contarFornecedores(): Long = contarPapeis(fornecedoresPapel)

    private data class PapelSchema(
        val table: org.jetbrains.exposed.v1.core.dao.id.LongIdTable,
        val idPessoa: org.jetbrains.exposed.v1.core.Column<org.jetbrains.exposed.v1.core.dao.id.EntityID<Long>>,
        val status: org.jetbrains.exposed.v1.core.Column<String>,
    )

    private val clientesPapel = PapelSchema(ClientesTable, ClientesTable.idPessoa, ClientesTable.status)
    private val fornecedoresPapel = PapelSchema(FornecedoresTable, FornecedoresTable.idPessoa, FornecedoresTable.status)

    private suspend fun listarPapeis(schema: PapelSchema): List<PapelCompleto> = suspendTransaction(database) {
        val rows = schema.table.innerJoin(PessoasTable).selectAll()
            .where {
                (schema.status neq Status.DELETADO.name.lowercase()) and
                    (PessoasTable.status neq Status.DELETADO.name.lowercase())
            }
            .orderBy(PessoasTable.nomeRazaoSocial to SortOrder.ASC)
            .toList()
        if (rows.isEmpty()) return@suspendTransaction emptyList()
        val pessoas = completar(rows.map { it.toPessoa() }).associateBy { it.pessoa.id }
        rows.map { row ->
            PapelCompleto(
                id = row[schema.table.id].value,
                idPessoa = row[schema.idPessoa].value,
                status = Status.valueOf(row[schema.status].uppercase()),
                pessoa = pessoas.getValue(row[schema.idPessoa].value),
            )
        }
    }

    private suspend fun buscarPapel(schema: PapelSchema, id: Long): PapelCompleto? = suspendTransaction(database) {
        val row = schema.table.innerJoin(PessoasTable).selectAll()
            .where {
                (schema.table.id eq id) and
                    (schema.status neq Status.DELETADO.name.lowercase()) and
                    (PessoasTable.status neq Status.DELETADO.name.lowercase())
            }
            .toList()
            .singleOrNull()
            ?: return@suspendTransaction null
        val pessoa = completar(listOf(row.toPessoa())).first()
        PapelCompleto(
            id = row[schema.table.id].value,
            idPessoa = row[schema.idPessoa].value,
            status = Status.valueOf(row[schema.status].uppercase()),
            pessoa = pessoa,
        )
    }

    private suspend fun buscarPapelPorPessoa(schema: PapelSchema, idPessoa: Long): PapelCompleto? =
        suspendTransaction(database) {
            val row = schema.table.innerJoin(PessoasTable).selectAll()
                .where {
                    (schema.idPessoa eq idPessoa) and
                        (PessoasTable.status neq Status.DELETADO.name.lowercase())
                }
                .toList()
                .singleOrNull()
                ?: return@suspendTransaction null
            val pessoa = completar(listOf(row.toPessoa())).first()
            PapelCompleto(
                id = row[schema.table.id].value,
                idPessoa = row[schema.idPessoa].value,
                status = Status.valueOf(row[schema.status].uppercase()),
                pessoa = pessoa,
            )
        }

    private suspend fun inserirPapel(
        schema: PapelSchema,
        idPessoa: Long,
        status: Status,
    ): Long = suspendTransaction(database) {
        schema.table.insert {
            it[schema.idPessoa] = idPessoa
            it[schema.status] = status.name.lowercase()
        }[schema.table.id].value
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

    private suspend fun excluirPapel(schema: PapelSchema, id: Long): Boolean = suspendTransaction(database) {
        schema.table.update({
            (schema.table.id eq id) and (schema.status neq Status.DELETADO.name.lowercase())
        }) {
            it[schema.status] = Status.DELETADO.name.lowercase()
        } > 0
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
        return pessoas.map { PessoaCompleta(it, docs[it.id].orEmpty()) }
    }

    private fun ResultRow.toTipo() = DocumentoTipo(
        id = this[DocumentoTiposTable.id].value,
        idPais = this[DocumentoTiposTable.idPais].value,
        tipoPessoa = TipoPessoa.valueOf(this[DocumentoTiposTable.tipoPessoa].uppercase()),
        codigo = this[DocumentoTiposTable.codigo],
        nome = this[DocumentoTiposTable.nome],
        unico = this[DocumentoTiposTable.unico],
    )

    private fun ResultRow.toPessoa() = Pessoa(
        id = this[PessoasTable.id].value,
        nomeRazaoSocial = this[PessoasTable.nomeRazaoSocial],
        tipoPessoa = TipoPessoa.valueOf(this[PessoasTable.tipoPessoa].uppercase()),
        ddi = this[PessoasTable.ddi],
        telefone = this[PessoasTable.telefone],
        email = this[PessoasTable.email],
        tipoLogradouro = this[PessoasTable.tipoLogradouro],
        logradouro = this[PessoasTable.logradouro],
        numero = this[PessoasTable.numero],
        bairro = this[PessoasTable.bairro],
        cep = this[PessoasTable.cep],
        complemento = this[PessoasTable.complemento],
        idCidade = this[PessoasTable.idCidade]?.value,
        status = Status.valueOf(this[PessoasTable.status].uppercase()),
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
