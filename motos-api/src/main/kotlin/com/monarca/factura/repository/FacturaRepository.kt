package com.monarca.factura.repository

data class FacturaRegistro(
    val id: Long,
    val idFilial: Long,
    val idVenda: Long,
    val referencia: String,
    val sudtaxId: Long?,
    val cdc: String?,
    val cdcFormatado: String?,
    val estado: String,
    val mensagem: String?,
    val protocoloLote: String?,
    val codigoSifen: String?,
    val estabelecimento: String?,
    val pontoExpedicao: String?,
    val clienteNome: String,
    val totalPyg: Double,
    val payloadEnvio: String?,
    val criadoEm: Long,
    val atualizadoEm: Long,
)

data class FacturaNova(
    val idFilial: Long,
    val idVenda: Long,
    val referencia: String,
    val sudtaxId: Long?,
    val cdc: String?,
    val cdcFormatado: String?,
    val estado: String,
    val mensagem: String?,
    val protocoloLote: String?,
    val codigoSifen: String?,
    val estabelecimento: String?,
    val pontoExpedicao: String?,
    val clienteNome: String,
    val totalPyg: Double,
    val payloadEnvio: String?,
)

data class FacturaAtualizacaoSudtax(
    val sudtaxId: Long?,
    val cdc: String?,
    val cdcFormatado: String?,
    val estado: String,
    val mensagem: String?,
    val protocoloLote: String?,
    val codigoSifen: String?,
)

interface FacturaRepository {
    suspend fun listar(idFilial: Long): List<FacturaRegistro>
    suspend fun buscar(id: Long): FacturaRegistro?
    suspend fun buscarPorVenda(idVenda: Long): FacturaRegistro?
    suspend fun buscarPorReferencia(referencia: String): FacturaRegistro?
    suspend fun inserir(nova: FacturaNova): Long
    suspend fun atualizarSudtax(id: Long, dados: FacturaAtualizacaoSudtax)
}
