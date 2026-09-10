package com.monarca.produto.repository

import com.monarca.common.enums.Status
import com.monarca.empresa.repository.FiliaisTable
import com.monarca.estoque.repository.EstoqueProdutosTable
import com.monarca.estoque.repository.EstoquesTable
import com.monarca.pessoa.domain.FilialVinculo
import com.monarca.produto.domain.Produto
import com.monarca.produto.domain.ProdutoBicicleta
import com.monarca.produto.domain.ProdutoCompleto
import com.monarca.produto.domain.ProdutoEstoqueSaldo
import com.monarca.produto.domain.ProdutoMoto
import com.monarca.produto.domain.ProdutoSaldoTotal
import com.monarca.produto.domain.TipoProduto
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.singleOrNull
import kotlinx.coroutines.flow.toList
import org.jetbrains.exposed.v1.core.JoinType
import org.jetbrains.exposed.v1.core.Op
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.greater
import org.jetbrains.exposed.v1.core.neq
import org.jetbrains.exposed.v1.core.or
import org.jetbrains.exposed.v1.r2dbc.R2dbcDatabase
import org.jetbrains.exposed.v1.r2dbc.insert
import org.jetbrains.exposed.v1.r2dbc.selectAll
import org.jetbrains.exposed.v1.r2dbc.transactions.suspendTransaction
import org.jetbrains.exposed.v1.r2dbc.update

class ExposedProdutoRepository(
    private val database: R2dbcDatabase,
) : ProdutoRepository {

    override suspend fun listar(
        idFilial: Long?,
        filtrarPorFilial: Boolean,
        tipo: TipoProduto?,
    ): List<ProdutoCompleto> = suspendTransaction(database) {
        val filtrar = filtrarPorFilial && idFilial != null
        val rows = if (filtrar) {
                ProdutosTable
                .innerJoin(ProdutoFilialTable)
                .join(FiliaisTable, JoinType.LEFT, ProdutosTable.idFilialCadastro, FiliaisTable.id)
                .join(MarcasTable, JoinType.INNER, ProdutosTable.idMarca, MarcasTable.id)
                .join(ModelosTable, JoinType.INNER, ProdutosTable.idModelo, ModelosTable.id)
                .selectAll()
                .where {
                    val porTipo = if (tipo != null) ProdutosTable.tipo eq tipo.name.lowercase() else Op.TRUE
                    (ProdutoFilialTable.idFilial eq idFilial!!) and
                        (ProdutoFilialTable.status neq Status.DELETADO.name.lowercase()) and
                        (ProdutosTable.status neq Status.DELETADO.name.lowercase()) and
                        porTipo
                }
                .orderBy(ProdutosTable.nome to SortOrder.ASC)
                .toList()
        } else {
            queryProdutos()
                .where {
                    val porTipo = if (tipo != null) ProdutosTable.tipo eq tipo.name.lowercase() else Op.TRUE
                    (ProdutosTable.status neq Status.DELETADO.name.lowercase()) and porTipo
                }
                .orderBy(ProdutosTable.nome to SortOrder.ASC)
                .toList()
        }
        rows.map { it.toLista() }
    }

    override suspend fun buscar(id: Long): ProdutoCompleto? = suspendTransaction(database) {
        val row = queryProdutos()
            .where { (ProdutosTable.id eq id) and (ProdutosTable.status neq Status.DELETADO.name.lowercase()) }
            .toList()
            .singleOrNull()
            ?: return@suspendTransaction null
        row.toCompleto()
    }

    override suspend fun buscarPorCodigo(codigo: String): ProdutoCompleto? = suspendTransaction(database) {
        val row = queryProdutos()
            .where { (ProdutosTable.codigo eq codigo) and (ProdutosTable.status neq Status.DELETADO.name.lowercase()) }
            .toList()
            .singleOrNull()
            ?: return@suspendTransaction null
        row.toCompleto()
    }

    override suspend fun existeCodigo(codigo: String, ignorarId: Long?): Boolean = suspendTransaction(database) {
        val idExistente = ProdutosTable.selectAll()
            .where { (ProdutosTable.codigo eq codigo) and (ProdutosTable.status neq Status.DELETADO.name.lowercase()) }
            .map { it[ProdutosTable.id].value }
            .singleOrNull()
        idExistente != null && idExistente != ignorarId
    }

    override suspend fun existeChassi(chassi: String, ignorarIdProduto: Long?): Boolean = suspendTransaction(database) {
        val idExistente = ProdutoMotosTable
            .innerJoin(ProdutosTable)
            .selectAll()
            .where {
                (ProdutoMotosTable.chassi eq chassi) and
                    (ProdutosTable.status neq Status.DELETADO.name.lowercase())
            }
            .map { it[ProdutoMotosTable.idProduto].value }
            .singleOrNull()
        idExistente != null && idExistente != ignorarIdProduto
    }

    override suspend fun existeNumeroSerieQuadro(serie: String, ignorarIdProduto: Long?): Boolean = suspendTransaction(database) {
        val idExistente = ProdutoBicicletasTable
            .innerJoin(ProdutosTable)
            .selectAll()
            .where {
                (ProdutoBicicletasTable.numeroSerieQuadro eq serie) and
                    (ProdutosTable.status neq Status.DELETADO.name.lowercase())
            }
            .map { it[ProdutoBicicletasTable.idProduto].value }
            .singleOrNull()
        idExistente != null && idExistente != ignorarIdProduto
    }

    override suspend fun inserir(
        produto: Produto,
        moto: ProdutoMoto?,
        bicicleta: ProdutoBicicleta?,
        idFilial: Long,
        quantidadeInicial: Int,
    ): Long = suspendTransaction(database) {
        val codigoInformado = produto.codigo.trim().uppercase()
        val placeholder = codigoInformado.ifEmpty {
            "TMP-${java.util.UUID.randomUUID().toString().replace("-", "").take(12)}"
        }
        val inserted = ProdutosTable.insert {
            it[codigo] = placeholder
            it[nome] = produto.nome
            it[idMarca] = produto.idMarca
            it[idModelo] = produto.idModelo
            it[descricao] = produto.descricao
            it[tipo] = produto.tipo.name.lowercase()
            it[idFilialCadastro] = idFilial
            it[aliquotaIva] = produto.aliquotaIva
            it[moedaPreco] = produto.moedaPreco.name.lowercase()
            it[precoLista] = produto.precoLista
            it[custo] = produto.custo
            it[status] = produto.status.name.lowercase()
        }
        val id = inserted[ProdutosTable.id].value
        val codigoFinal = if (codigoInformado.isEmpty()) codigoLivreAPartir(id) else codigoInformado
        if (codigoFinal != placeholder) {
            ProdutosTable.update({ ProdutosTable.id eq id }) {
                it[codigo] = codigoFinal
            }
        }
        gravarEspecifico(id, produto.tipo, moto, bicicleta)
        vincularFilialInterno(id, idFilial, auditar = true)
        val itens = com.monarca.estoque.repository.EstoqueProdutoSeed.garantirProdutoNaFilial(
            id,
            idFilial,
            quantidadeInicial,
        )
        check(itens.isNotEmpty()) { "Não foi possível criar o saldo zerado nos estoques da filial" }
        com.monarca.estoque.repository.EstoqueProdutoSeed.auditarInsert(
            "produto",
            id,
            """{"codigo":"$codigoFinal","nome":"${produto.nome}","idMarca":${produto.idMarca},"idModelo":${produto.idModelo},"tipo":"${produto.tipo.name.lowercase()}","status":"${produto.status.name.lowercase()}"}""",
        )
        id
    }

    private suspend fun codigoLivreAPartir(id: Long): String {
        var candidato = id
        while (
            ProdutosTable.selectAll()
                .where {
                    (ProdutosTable.codigo eq candidato.toString()) and
                        (ProdutosTable.id neq id) and
                        (ProdutosTable.status neq Status.DELETADO.name.lowercase())
                }
                .toList()
                .isNotEmpty()
        ) {
            candidato += 1
        }
        return candidato.toString()
    }

    override suspend fun atualizar(
        id: Long,
        produto: Produto,
        moto: ProdutoMoto?,
        bicicleta: ProdutoBicicleta?,
    ): Boolean = suspendTransaction(database) {
        val ok = ProdutosTable.update({
            (ProdutosTable.id eq id) and (ProdutosTable.status neq Status.DELETADO.name.lowercase())
        }) {
            it[codigo] = produto.codigo
            it[nome] = produto.nome
            it[idMarca] = produto.idMarca
            it[idModelo] = produto.idModelo
            it[descricao] = produto.descricao
            it[tipo] = produto.tipo.name.lowercase()
            it[aliquotaIva] = produto.aliquotaIva
            it[moedaPreco] = produto.moedaPreco.name.lowercase()
            it[precoLista] = produto.precoLista
            it[custo] = produto.custo
            it[status] = produto.status.name.lowercase()
        } > 0
        if (ok) gravarEspecifico(id, produto.tipo, moto, bicicleta)
        ok
    }

    override suspend fun atualizarStatus(id: Long, status: Status): Boolean = suspendTransaction(database) {
        ProdutosTable.update({
            (ProdutosTable.id eq id) and (ProdutosTable.status neq Status.DELETADO.name.lowercase())
        }) {
            it[ProdutosTable.status] = status.name.lowercase()
        } > 0
    }

    override suspend fun excluir(id: Long, idFilial: Long?): Boolean = suspendTransaction(database) {
        if (idFilial != null) {
            val idsEstoque = EstoquesTable.selectAll()
                .where {
                    (EstoquesTable.idFilial eq idFilial) and
                        (EstoquesTable.status neq Status.DELETADO.name.lowercase())
                }
                .toList()
                .map { it[EstoquesTable.id].value }
            for (idEstoque in idsEstoque) {
                EstoqueProdutosTable.update({
                    (EstoqueProdutosTable.idProduto eq id) and
                        (EstoqueProdutosTable.idEstoque eq idEstoque) and
                        (EstoqueProdutosTable.status neq Status.DELETADO.name.lowercase())
                }) {
                    it[status] = Status.DELETADO.name.lowercase()
                }
            }
            ProdutoFilialTable.update({
                (ProdutoFilialTable.idProduto eq id) and
                    (ProdutoFilialTable.idFilial eq idFilial) and
                    (ProdutoFilialTable.status neq Status.DELETADO.name.lowercase())
            }) {
                it[status] = Status.DELETADO.name.lowercase()
            } > 0
        } else {
            EstoqueProdutosTable.update({
                (EstoqueProdutosTable.idProduto eq id) and
                    (EstoqueProdutosTable.status neq Status.DELETADO.name.lowercase())
            }) {
                it[status] = Status.DELETADO.name.lowercase()
            }
            ProdutoFilialTable.update({
                (ProdutoFilialTable.idProduto eq id) and
                    (ProdutoFilialTable.status neq Status.DELETADO.name.lowercase())
            }) {
                it[status] = Status.DELETADO.name.lowercase()
            }
            ProdutosTable.update({
                (ProdutosTable.id eq id) and (ProdutosTable.status neq Status.DELETADO.name.lowercase())
            }) {
                it[status] = Status.DELETADO.name.lowercase()
                it[codigo] = "#$id"
            } > 0
        }
    }

    override suspend fun produtoEmUso(id: Long): Boolean = suspendTransaction(database) {
        EstoqueProdutosTable.selectAll()
            .where {
                (EstoqueProdutosTable.idProduto eq id) and
                    (EstoqueProdutosTable.status neq Status.DELETADO.name.lowercase()) and
                    ((EstoqueProdutosTable.quantidade greater 0) or (EstoqueProdutosTable.quantidadeReservada greater 0))
            }
            .toList()
            .isNotEmpty()
    }

    override suspend fun vincularFilial(idProduto: Long, idFilial: Long): Boolean = suspendTransaction(database) {
        vincularFilialInterno(idProduto, idFilial, auditar = true)
        val itens = com.monarca.estoque.repository.EstoqueProdutoSeed.garantirProdutoNaFilial(idProduto, idFilial)
        check(itens.isNotEmpty()) { "Não foi possível criar o saldo zerado nos estoques da filial" }
        true
    }

    override suspend fun existeVinculoFilial(idProduto: Long, idFilial: Long): Boolean = suspendTransaction(database) {
        ProdutoFilialTable.selectAll()
            .where {
                (ProdutoFilialTable.idProduto eq idProduto) and
                    (ProdutoFilialTable.idFilial eq idFilial) and
                    (ProdutoFilialTable.status neq Status.DELETADO.name.lowercase())
            }
            .toList()
            .isNotEmpty()
    }

    override suspend fun listarFiliais(idProduto: Long): List<FilialVinculo> = suspendTransaction(database) {
        listarFiliaisInterno(idProduto)
    }

    override suspend fun somarEstoquePorFilial(idFilial: Long): Map<Long, ProdutoSaldoTotal> =
        suspendTransaction(database) {
            EstoqueProdutosTable
                .innerJoin(EstoquesTable)
                .innerJoin(FiliaisTable)
                .selectAll()
                .where {
                    (EstoquesTable.idFilial eq idFilial) and
                        (FiliaisTable.idEstoquePadrao eq EstoquesTable.id) and
                        (EstoqueProdutosTable.status neq Status.DELETADO.name.lowercase()) and
                        (EstoquesTable.status neq Status.DELETADO.name.lowercase())
                }
                .toList()
                .groupBy { it[EstoqueProdutosTable.idProduto].value }
                .mapValues { (_, linhas) ->
                    ProdutoSaldoTotal(
                        quantidade = linhas.sumOf { it[EstoqueProdutosTable.quantidade] },
                        quantidadeReservada = linhas.sumOf { it[EstoqueProdutosTable.quantidadeReservada] },
                    )
                }
        }

    override suspend fun listarEstoqueDoProduto(idProduto: Long, idFilial: Long): List<ProdutoEstoqueSaldo> =
        suspendTransaction(database) {
            EstoqueProdutosTable
                .innerJoin(EstoquesTable)
                .innerJoin(FiliaisTable)
                .selectAll()
                .where {
                    (EstoqueProdutosTable.idProduto eq idProduto) and
                        (EstoquesTable.idFilial eq idFilial) and
                        (EstoqueProdutosTable.status neq Status.DELETADO.name.lowercase()) and
                        (EstoquesTable.status neq Status.DELETADO.name.lowercase())
                }
                .orderBy(EstoquesTable.nome to SortOrder.ASC)
                .toList()
                .map {
                    val idEstoque = it[EstoquesTable.id].value
                    ProdutoEstoqueSaldo(
                        idEstoque = idEstoque,
                        estoqueNome = it[EstoquesTable.nome],
                        quantidade = it[EstoqueProdutosTable.quantidade],
                        quantidadeReservada = it[EstoqueProdutosTable.quantidadeReservada],
                        padrao = it[FiliaisTable.idEstoquePadrao] == idEstoque,
                    )
                }
        }

    private fun queryProdutos() = ProdutosTable
        .join(FiliaisTable, JoinType.LEFT, ProdutosTable.idFilialCadastro, FiliaisTable.id)
        .join(MarcasTable, JoinType.INNER, ProdutosTable.idMarca, MarcasTable.id)
        .join(ModelosTable, JoinType.INNER, ProdutosTable.idModelo, ModelosTable.id)
        .selectAll()

    private suspend fun gravarEspecifico(
        idProduto: Long,
        tipo: TipoProduto,
        moto: ProdutoMoto?,
        bicicleta: ProdutoBicicleta?,
    ) {
        when (tipo) {
            TipoProduto.MOTO -> upsertMoto(idProduto, requireNotNull(moto) { "Dados da moto são obrigatórios" })
            TipoProduto.BICICLETA -> upsertBicicleta(idProduto, requireNotNull(bicicleta) { "Dados da bicicleta são obrigatórios" })
        }
    }

    private suspend fun upsertMoto(idProduto: Long, moto: ProdutoMoto) {
        val existente = ProdutoMotosTable.selectAll()
            .where { ProdutoMotosTable.idProduto eq idProduto }
            .toList()
            .singleOrNull()
        if (existente != null) {
            ProdutoMotosTable.update({ ProdutoMotosTable.idProduto eq idProduto }) {
                it[chassi] = moto.chassi
                it[cor] = moto.cor
                it[potenciaMotorW] = moto.potenciaMotorW
                it[autonomiaKm] = moto.autonomiaKm
                it[velocidadeMaxKmh] = moto.velocidadeMaxKmh
                it[capacidadeBateriaAh] = moto.capacidadeBateriaAh
                it[voltagemBateria] = moto.voltagemBateria
                it[tempoCargaHoras] = moto.tempoCargaHoras
                it[pesoKg] = moto.pesoKg
                it[capacidadeCargaKg] = moto.capacidadeCargaKg
                it[assentos] = moto.assentos
                it[tipoFreio] = moto.tipoFreio
                it[anoFabricacao] = moto.anoFabricacao
                it[anoModelo] = moto.anoModelo
            }
        } else {
            ProdutoMotosTable.insert {
                it[ProdutoMotosTable.idProduto] = idProduto
                it[chassi] = moto.chassi
                it[cor] = moto.cor
                it[potenciaMotorW] = moto.potenciaMotorW
                it[autonomiaKm] = moto.autonomiaKm
                it[velocidadeMaxKmh] = moto.velocidadeMaxKmh
                it[capacidadeBateriaAh] = moto.capacidadeBateriaAh
                it[voltagemBateria] = moto.voltagemBateria
                it[tempoCargaHoras] = moto.tempoCargaHoras
                it[pesoKg] = moto.pesoKg
                it[capacidadeCargaKg] = moto.capacidadeCargaKg
                it[assentos] = moto.assentos
                it[tipoFreio] = moto.tipoFreio
                it[anoFabricacao] = moto.anoFabricacao
                it[anoModelo] = moto.anoModelo
            }
        }
    }

    private suspend fun upsertBicicleta(idProduto: Long, bicicleta: ProdutoBicicleta) {
        val existente = ProdutoBicicletasTable.selectAll()
            .where { ProdutoBicicletasTable.idProduto eq idProduto }
            .toList()
            .singleOrNull()
        if (existente != null) {
            ProdutoBicicletasTable.update({ ProdutoBicicletasTable.idProduto eq idProduto }) {
                it[cor] = bicicleta.cor
                it[potenciaMotorW] = bicicleta.potenciaMotorW
                it[autonomiaKm] = bicicleta.autonomiaKm
                it[capacidadeBateriaAh] = bicicleta.capacidadeBateriaAh
                it[voltagemBateria] = bicicleta.voltagemBateria
                it[tempoCargaHoras] = bicicleta.tempoCargaHoras
                it[pesoKg] = bicicleta.pesoKg
                it[aro] = bicicleta.aro
                it[tipoQuadro] = bicicleta.tipoQuadro
                it[numeroMarchas] = bicicleta.numeroMarchas
                it[tipoFreio] = bicicleta.tipoFreio
                it[numeroSerieQuadro] = bicicleta.numeroSerieQuadro
            }
        } else {
            ProdutoBicicletasTable.insert {
                it[ProdutoBicicletasTable.idProduto] = idProduto
                it[cor] = bicicleta.cor
                it[potenciaMotorW] = bicicleta.potenciaMotorW
                it[autonomiaKm] = bicicleta.autonomiaKm
                it[capacidadeBateriaAh] = bicicleta.capacidadeBateriaAh
                it[voltagemBateria] = bicicleta.voltagemBateria
                it[tempoCargaHoras] = bicicleta.tempoCargaHoras
                it[pesoKg] = bicicleta.pesoKg
                it[aro] = bicicleta.aro
                it[tipoQuadro] = bicicleta.tipoQuadro
                it[numeroMarchas] = bicicleta.numeroMarchas
                it[tipoFreio] = bicicleta.tipoFreio
                it[numeroSerieQuadro] = bicicleta.numeroSerieQuadro
            }
        }
    }

    private suspend fun vincularFilialInterno(idProduto: Long, idFilial: Long, auditar: Boolean) {
        val existente = ProdutoFilialTable.selectAll()
            .where {
                (ProdutoFilialTable.idProduto eq idProduto) and (ProdutoFilialTable.idFilial eq idFilial)
            }
            .toList()
            .singleOrNull()
        if (existente != null) {
            val idVinculo = existente[ProdutoFilialTable.id].value
            if (existente[ProdutoFilialTable.status] == Status.DELETADO.name.lowercase()) {
                ProdutoFilialTable.update({ ProdutoFilialTable.id eq idVinculo }) {
                    it[status] = Status.ATIVO.name.lowercase()
                }
                if (auditar) {
                    com.monarca.estoque.repository.EstoqueProdutoSeed.auditarInsert(
                        "produto_filial",
                        idVinculo,
                        """{"idProduto":$idProduto,"idFilial":$idFilial,"status":"ativo"}""",
                    )
                }
            }
            return
        }
        val inserted = ProdutoFilialTable.insert {
            it[ProdutoFilialTable.idProduto] = idProduto
            it[ProdutoFilialTable.idFilial] = idFilial
            it[status] = Status.ATIVO.name.lowercase()
        }
        val idVinculo = inserted[ProdutoFilialTable.id].value
        check(idVinculo > 0) { "Falha ao vincular o produto à filial" }
        if (auditar) {
            com.monarca.estoque.repository.EstoqueProdutoSeed.auditarInsert(
                "produto_filial",
                idVinculo,
                """{"idProduto":$idProduto,"idFilial":$idFilial,"status":"ativo"}""",
            )
        }
    }

    private suspend fun listarFiliaisInterno(idProduto: Long): List<FilialVinculo> =
        ProdutoFilialTable
            .innerJoin(FiliaisTable)
            .selectAll()
            .where {
                (ProdutoFilialTable.idProduto eq idProduto) and
                    (ProdutoFilialTable.status neq Status.DELETADO.name.lowercase()) and
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

    private fun ResultRow.toLista() = ProdutoCompleto(
        produto = toProduto(),
        filialNome = getOrNull(FiliaisTable.nome),
        filiaisVinculadas = emptyList(),
        moto = null,
        bicicleta = null,
    )

    private suspend fun ResultRow.toCompleto(): ProdutoCompleto {
        val produto = toProduto()
        val moto = if (produto.tipo == TipoProduto.MOTO) buscarMoto(produto.id) else null
        val bicicleta = if (produto.tipo == TipoProduto.BICICLETA) buscarBicicleta(produto.id) else null
        return ProdutoCompleto(
            produto = produto,
            filialNome = getOrNull(FiliaisTable.nome),
            filiaisVinculadas = listarFiliaisInterno(produto.id),
            moto = moto,
            bicicleta = bicicleta,
        )
    }

    private fun ResultRow.toProduto() = Produto(
        id = this[ProdutosTable.id].value,
        codigo = this[ProdutosTable.codigo],
        nome = this[ProdutosTable.nome],
        idMarca = this[ProdutosTable.idMarca].value,
        idModelo = this[ProdutosTable.idModelo].value,
        marcaNome = this[MarcasTable.nome],
        modeloNome = this[ModelosTable.nome],
        descricao = this[ProdutosTable.descricao],
        tipo = TipoProduto.valueOf(this[ProdutosTable.tipo].uppercase()),
        idFilialCadastro = this[ProdutosTable.idFilialCadastro]?.value,
        aliquotaIva = this[ProdutosTable.aliquotaIva],
        moedaPreco = com.monarca.produto.domain.Moeda.valueOf(this[ProdutosTable.moedaPreco].uppercase()),
        precoLista = this[ProdutosTable.precoLista],
        custo = this[ProdutosTable.custo],
        status = Status.valueOf(this[ProdutosTable.status].uppercase()),
    )

    private suspend fun buscarMoto(idProduto: Long): ProdutoMoto? =
        ProdutoMotosTable.selectAll()
            .where { ProdutoMotosTable.idProduto eq idProduto }
            .map {
                ProdutoMoto(
                    id = it[ProdutoMotosTable.id].value,
                    idProduto = it[ProdutoMotosTable.idProduto].value,
                    chassi = it[ProdutoMotosTable.chassi],
                    cor = it[ProdutoMotosTable.cor],
                    potenciaMotorW = it[ProdutoMotosTable.potenciaMotorW],
                    autonomiaKm = it[ProdutoMotosTable.autonomiaKm],
                    velocidadeMaxKmh = it[ProdutoMotosTable.velocidadeMaxKmh],
                    capacidadeBateriaAh = it[ProdutoMotosTable.capacidadeBateriaAh],
                    voltagemBateria = it[ProdutoMotosTable.voltagemBateria],
                    tempoCargaHoras = it[ProdutoMotosTable.tempoCargaHoras],
                    pesoKg = it[ProdutoMotosTable.pesoKg],
                    capacidadeCargaKg = it[ProdutoMotosTable.capacidadeCargaKg],
                    assentos = it[ProdutoMotosTable.assentos],
                    tipoFreio = it[ProdutoMotosTable.tipoFreio],
                    anoFabricacao = it[ProdutoMotosTable.anoFabricacao],
                    anoModelo = it[ProdutoMotosTable.anoModelo],
                )
            }
            .singleOrNull()

    private suspend fun buscarBicicleta(idProduto: Long): ProdutoBicicleta? =
        ProdutoBicicletasTable.selectAll()
            .where { ProdutoBicicletasTable.idProduto eq idProduto }
            .map {
                ProdutoBicicleta(
                    id = it[ProdutoBicicletasTable.id].value,
                    idProduto = it[ProdutoBicicletasTable.idProduto].value,
                    cor = it[ProdutoBicicletasTable.cor],
                    potenciaMotorW = it[ProdutoBicicletasTable.potenciaMotorW],
                    autonomiaKm = it[ProdutoBicicletasTable.autonomiaKm],
                    capacidadeBateriaAh = it[ProdutoBicicletasTable.capacidadeBateriaAh],
                    voltagemBateria = it[ProdutoBicicletasTable.voltagemBateria],
                    tempoCargaHoras = it[ProdutoBicicletasTable.tempoCargaHoras],
                    pesoKg = it[ProdutoBicicletasTable.pesoKg],
                    aro = it[ProdutoBicicletasTable.aro],
                    tipoQuadro = it[ProdutoBicicletasTable.tipoQuadro],
                    numeroMarchas = it[ProdutoBicicletasTable.numeroMarchas],
                    tipoFreio = it[ProdutoBicicletasTable.tipoFreio],
                    numeroSerieQuadro = it[ProdutoBicicletasTable.numeroSerieQuadro],
                )
            }
            .singleOrNull()
}
