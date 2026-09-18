package com.monarca.factura.repository

import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.singleOrNull
import kotlinx.coroutines.flow.toList
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.r2dbc.R2dbcDatabase
import org.jetbrains.exposed.v1.r2dbc.insert
import org.jetbrains.exposed.v1.r2dbc.selectAll
import org.jetbrains.exposed.v1.r2dbc.transactions.suspendTransaction
import org.jetbrains.exposed.v1.r2dbc.update

class ExposedFacturaRepository(
    private val database: R2dbcDatabase,
) : FacturaRepository {

    override suspend fun listar(idFilial: Long): List<FacturaRegistro> = suspendTransaction(database) {
        FacturasTable.selectAll()
            .where { FacturasTable.idFilial eq idFilial }
            .orderBy(FacturasTable.criadoEm to SortOrder.DESC)
            .map { it.toRegistro() }
            .toList()
    }

    override suspend fun buscar(id: Long): FacturaRegistro? = suspendTransaction(database) {
        FacturasTable.selectAll()
            .where { FacturasTable.id eq id }
            .map { it.toRegistro() }
            .singleOrNull()
    }

    override suspend fun buscarPorVenda(idVenda: Long): FacturaRegistro? = suspendTransaction(database) {
        FacturasTable.selectAll()
            .where { FacturasTable.idVenda eq idVenda }
            .map { it.toRegistro() }
            .singleOrNull()
    }

    override suspend fun buscarPorReferencia(referencia: String): FacturaRegistro? = suspendTransaction(database) {
        FacturasTable.selectAll()
            .where { FacturasTable.referencia eq referencia }
            .map { it.toRegistro() }
            .singleOrNull()
    }

    override suspend fun inserir(nova: FacturaNova): Long = suspendTransaction(database) {
        val agora = System.currentTimeMillis()
        val inserted = FacturasTable.insert {
            it[idFilial] = nova.idFilial
            it[idVenda] = nova.idVenda
            it[referencia] = nova.referencia
            it[sudtaxId] = nova.sudtaxId
            it[cdc] = nova.cdc
            it[cdcFormatado] = nova.cdcFormatado
            it[estado] = nova.estado
            it[mensagem] = nova.mensagem
            it[protocoloLote] = nova.protocoloLote
            it[codigoSifen] = nova.codigoSifen
            it[estabelecimento] = nova.estabelecimento
            it[pontoExpedicao] = nova.pontoExpedicao
            it[clienteNome] = nova.clienteNome
            it[totalPyg] = nova.totalPyg
            it[payloadEnvio] = nova.payloadEnvio
            it[criadoEm] = agora
            it[atualizadoEm] = agora
        }
        inserted[FacturasTable.id].value
    }

    override suspend fun atualizarSudtax(id: Long, dados: FacturaAtualizacaoSudtax) {
        suspendTransaction(database) {
            FacturasTable.update({ FacturasTable.id eq id }) {
                if (dados.sudtaxId != null) it[sudtaxId] = dados.sudtaxId
                it[cdc] = dados.cdc
                it[cdcFormatado] = dados.cdcFormatado
                it[estado] = dados.estado
                it[mensagem] = dados.mensagem
                it[protocoloLote] = dados.protocoloLote
                it[codigoSifen] = dados.codigoSifen
                it[atualizadoEm] = System.currentTimeMillis()
            }
        }
    }

    private fun ResultRow.toRegistro() = FacturaRegistro(
        id = this[FacturasTable.id].value,
        idFilial = this[FacturasTable.idFilial].value,
        idVenda = this[FacturasTable.idVenda].value,
        referencia = this[FacturasTable.referencia],
        sudtaxId = this[FacturasTable.sudtaxId],
        cdc = this[FacturasTable.cdc],
        cdcFormatado = this[FacturasTable.cdcFormatado],
        estado = this[FacturasTable.estado],
        mensagem = this[FacturasTable.mensagem],
        protocoloLote = this[FacturasTable.protocoloLote],
        codigoSifen = this[FacturasTable.codigoSifen],
        estabelecimento = this[FacturasTable.estabelecimento],
        pontoExpedicao = this[FacturasTable.pontoExpedicao],
        clienteNome = this[FacturasTable.clienteNome],
        totalPyg = this[FacturasTable.totalPyg],
        payloadEnvio = this[FacturasTable.payloadEnvio],
        criadoEm = this[FacturasTable.criadoEm],
        atualizadoEm = this[FacturasTable.atualizadoEm],
    )
}
