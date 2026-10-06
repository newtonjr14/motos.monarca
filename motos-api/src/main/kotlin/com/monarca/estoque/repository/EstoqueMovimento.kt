package com.monarca.estoque.repository

import kotlinx.coroutines.flow.single
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.r2dbc.insert
import org.jetbrains.exposed.v1.r2dbc.selectAll

suspend fun registrarMovimentoEstoque(
    idEstoque: Long,
    idProduto: Long,
    tipo: String,
    quantidade: Int,
    saldoDepois: Int,
    idDocumento: Long? = null,
    observacao: String? = null,
    idUsuario: Long? = null,
) {
    if (quantidade == 0) return
    val idFilial = EstoquesTable.selectAll()
        .where { EstoquesTable.id eq idEstoque }
        .single()[EstoquesTable.idFilial].value
    val nota = observacao?.trim()?.take(240)?.ifEmpty { null }
    EstoqueMovimentosTable.insert {
        it[EstoqueMovimentosTable.idFilial] = idFilial
        it[EstoqueMovimentosTable.idEstoque] = idEstoque
        it[EstoqueMovimentosTable.idProduto] = idProduto
        it[EstoqueMovimentosTable.tipo] = tipo
        it[EstoqueMovimentosTable.quantidade] = quantidade
        it[EstoqueMovimentosTable.saldoDepois] = saldoDepois
        it[EstoqueMovimentosTable.idDocumento] = idDocumento
        it[EstoqueMovimentosTable.observacao] = nota
        it[EstoqueMovimentosTable.idUsuario] = idUsuario
        it[EstoqueMovimentosTable.criadoEm] = System.currentTimeMillis()
    }
}
