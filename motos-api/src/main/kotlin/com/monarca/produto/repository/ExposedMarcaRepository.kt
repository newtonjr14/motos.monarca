package com.monarca.produto.repository

import com.monarca.common.enums.Status
import com.monarca.estoque.repository.EstoqueProdutoSeed
import com.monarca.produto.domain.Marca
import com.monarca.produto.domain.Modelo
import com.monarca.produto.domain.ModeloDetalhe
import com.monarca.produto.domain.TipoProduto
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

class ExposedMarcaRepository(
    private val database: R2dbcDatabase,
) : MarcaRepository {

    override suspend fun listar(): List<Marca> = suspendTransaction(database) {
        MarcasTable.selectAll()
            .where { MarcasTable.status neq Status.DELETADO.name.lowercase() }
            .orderBy(MarcasTable.nome to SortOrder.ASC)
            .map { it.toMarca() }
            .toList()
    }

    override suspend fun buscar(id: Long): Marca? = suspendTransaction(database) {
        MarcasTable.selectAll()
            .where { (MarcasTable.id eq id) and (MarcasTable.status neq Status.DELETADO.name.lowercase()) }
            .map { it.toMarca() }
            .singleOrNull()
    }

    override suspend fun existeNome(nome: String, ignorarId: Long?): Boolean = suspendTransaction(database) {
        val idExistente = MarcasTable.selectAll()
            .where { (MarcasTable.nome eq nome) and (MarcasTable.status neq Status.DELETADO.name.lowercase()) }
            .map { it[MarcasTable.id].value }
            .singleOrNull()
        idExistente != null && idExistente != ignorarId
    }

    override suspend fun inserir(marca: Marca): Long = suspendTransaction(database) {
        val inserted = MarcasTable.insert {
            it[nome] = marca.nome
            it[status] = marca.status.name.lowercase()
        }
        val id = inserted[MarcasTable.id].value
        EstoqueProdutoSeed.auditarInsert("marca", id, """{"nome":"${marca.nome}","status":"${marca.status.name.lowercase()}"}""")
        id
    }

    override suspend fun atualizar(id: Long, marca: Marca): Boolean = suspendTransaction(database) {
        MarcasTable.update({
            (MarcasTable.id eq id) and (MarcasTable.status neq Status.DELETADO.name.lowercase())
        }) {
            it[nome] = marca.nome
            it[status] = marca.status.name.lowercase()
        } > 0
    }

    override suspend fun excluir(id: Long): Boolean = suspendTransaction(database) {
        MarcasTable.update({
            (MarcasTable.id eq id) and (MarcasTable.status neq Status.DELETADO.name.lowercase())
        }) {
            it[status] = Status.DELETADO.name.lowercase()
        } > 0
    }

    override suspend fun temModelos(idMarca: Long): Boolean = suspendTransaction(database) {
        ModelosTable.selectAll()
            .where { (ModelosTable.idMarca eq idMarca) and (ModelosTable.status neq Status.DELETADO.name.lowercase()) }
            .toList()
            .isNotEmpty()
    }

    override suspend fun atualizarNomesProdutosDaMarca(idMarca: Long) = suspendTransaction(database) {
        atualizarNomes(ProdutosTable.idMarca eq idMarca)
    }

    override suspend fun listarModelos(idMarca: Long?, tipo: TipoProduto?): List<ModeloDetalhe> =
        suspendTransaction(database) {
            queryModelos()
                .where {
                    val porMarca = if (idMarca != null) ModelosTable.idMarca eq idMarca else Op.TRUE
                    val porTipo = if (tipo != null) ModelosTable.tipo eq tipo.name.lowercase() else Op.TRUE
                    (ModelosTable.status neq Status.DELETADO.name.lowercase()) and
                        (MarcasTable.status neq Status.DELETADO.name.lowercase()) and
                        porMarca and porTipo
                }
                .orderBy(MarcasTable.nome to SortOrder.ASC, ModelosTable.nome to SortOrder.ASC)
                .map { it.toModeloDetalhe() }
                .toList()
        }

    override suspend fun buscarModelo(id: Long): ModeloDetalhe? = suspendTransaction(database) {
        queryModelos()
            .where { (ModelosTable.id eq id) and (ModelosTable.status neq Status.DELETADO.name.lowercase()) }
            .map { it.toModeloDetalhe() }
            .singleOrNull()
    }

    override suspend fun existeNomeModelo(idMarca: Long, nome: String, ignorarId: Long?): Boolean =
        suspendTransaction(database) {
            val idExistente = ModelosTable.selectAll()
                .where {
                    (ModelosTable.idMarca eq idMarca) and
                        (ModelosTable.nome eq nome) and
                        (ModelosTable.status neq Status.DELETADO.name.lowercase())
                }
                .map { it[ModelosTable.id].value }
                .singleOrNull()
            idExistente != null && idExistente != ignorarId
        }

    override suspend fun inserirModelo(modelo: Modelo): Long = suspendTransaction(database) {
        val inserted = ModelosTable.insert {
            it[idMarca] = modelo.idMarca
            it[nome] = modelo.nome
            it[tipo] = modelo.tipo.name.lowercase()
            it[status] = modelo.status.name.lowercase()
        }
        val id = inserted[ModelosTable.id].value
        EstoqueProdutoSeed.auditarInsert(
            "modelo",
            id,
            """{"idMarca":${modelo.idMarca},"nome":"${modelo.nome}","tipo":"${modelo.tipo.name.lowercase()}","status":"${modelo.status.name.lowercase()}"}""",
        )
        id
    }

    override suspend fun atualizarModelo(id: Long, modelo: Modelo): Boolean = suspendTransaction(database) {
        ModelosTable.update({
            (ModelosTable.id eq id) and (ModelosTable.status neq Status.DELETADO.name.lowercase())
        }) {
            it[idMarca] = modelo.idMarca
            it[nome] = modelo.nome
            it[tipo] = modelo.tipo.name.lowercase()
            it[status] = modelo.status.name.lowercase()
        } > 0
    }

    override suspend fun excluirModelo(id: Long): Boolean = suspendTransaction(database) {
        ModelosTable.update({
            (ModelosTable.id eq id) and (ModelosTable.status neq Status.DELETADO.name.lowercase())
        }) {
            it[status] = Status.DELETADO.name.lowercase()
        } > 0
    }

    override suspend fun temProdutos(idModelo: Long): Boolean = suspendTransaction(database) {
        ProdutosTable.selectAll()
            .where { (ProdutosTable.idModelo eq idModelo) and (ProdutosTable.status neq Status.DELETADO.name.lowercase()) }
            .toList()
            .isNotEmpty()
    }

    override suspend fun atualizarNomesProdutosDoModelo(idModelo: Long) = suspendTransaction(database) {
        atualizarNomes(ProdutosTable.idModelo eq idModelo)
    }

    override suspend fun sincronizarMarcaDosProdutos(idModelo: Long, idMarca: Long) = suspendTransaction(database) {
        ProdutosTable.update({
            (ProdutosTable.idModelo eq idModelo) and (ProdutosTable.status neq Status.DELETADO.name.lowercase())
        }) {
            it[ProdutosTable.idMarca] = idMarca
        }
        atualizarNomes(ProdutosTable.idModelo eq idModelo)
    }

    private fun queryModelos() = ModelosTable.innerJoin(MarcasTable).selectAll()

    private suspend fun atualizarNomes(filtro: org.jetbrains.exposed.v1.core.Op<Boolean>) {
        val linhas = ProdutosTable
            .join(MarcasTable, org.jetbrains.exposed.v1.core.JoinType.INNER, ProdutosTable.idMarca, MarcasTable.id)
            .join(ModelosTable, org.jetbrains.exposed.v1.core.JoinType.INNER, ProdutosTable.idModelo, ModelosTable.id)
            .selectAll()
            .where { filtro and (ProdutosTable.status neq Status.DELETADO.name.lowercase()) }
            .toList()
        for (linha in linhas) {
            val id = linha[ProdutosTable.id].value
            val composto = "${linha[MarcasTable.nome]} ${linha[ModelosTable.nome]}"
            ProdutosTable.update({ ProdutosTable.id eq id }) {
                it[nome] = composto
            }
        }
    }

    private fun ResultRow.toMarca() = Marca(
        id = this[MarcasTable.id].value,
        nome = this[MarcasTable.nome],
        status = Status.valueOf(this[MarcasTable.status].uppercase()),
    )

    private fun ResultRow.toModeloDetalhe() = ModeloDetalhe(
        modelo = Modelo(
            id = this[ModelosTable.id].value,
            idMarca = this[ModelosTable.idMarca].value,
            nome = this[ModelosTable.nome],
            tipo = TipoProduto.valueOf(this[ModelosTable.tipo].uppercase()),
            status = Status.valueOf(this[ModelosTable.status].uppercase()),
        ),
        marcaNome = this[MarcasTable.nome],
    )
}
