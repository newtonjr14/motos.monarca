package com.monarca.factura.repository

import com.monarca.empresa.repository.FiliaisTable
import com.monarca.venda.repository.VendasTable
import org.jetbrains.exposed.v1.core.dao.id.LongIdTable

object FacturasTable : LongIdTable("factura") {
    val idFilial = reference("id_filial", FiliaisTable)
    val idVenda = reference("id_venda", VendasTable)
    val referencia = varchar("referencia", 80)
    val sudtaxId = long("sudtax_id").nullable()
    val cdc = varchar("cdc", 44).nullable()
    val cdcFormatado = varchar("cdc_formatado", 80).nullable()
    val estado = varchar("estado", 20).default("pendente")
    val mensagem = varchar("mensagem", 500).nullable()
    val protocoloLote = varchar("protocolo_lote", 80).nullable()
    val codigoSifen = varchar("codigo_sifen", 40).nullable()
    val estabelecimento = varchar("estabelecimento", 10).nullable()
    val pontoExpedicao = varchar("ponto_expedicao", 10).nullable()
    val clienteNome = varchar("cliente_nome", 200)
    val totalPyg = double("total_pyg")
    val payloadEnvio = text("payload_envio").nullable()
    val criadoEm = long("criado_em")
    val atualizadoEm = long("atualizado_em")
}
