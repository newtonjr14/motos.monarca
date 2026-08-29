package com.monarca.pessoa.repository

import com.monarca.common.enums.Status
import com.monarca.pessoa.domain.DocumentoTipo
import com.monarca.pessoa.domain.PapelCompleto
import com.monarca.pessoa.domain.Pessoa
import com.monarca.pessoa.domain.PessoaCompleta
import com.monarca.pessoa.domain.TipoPessoa

data class DocumentoNovo(
    val idPais: Long,
    val idTipoDocumento: Long?,
    val tipoLivre: String?,
    val numero: String,
)

interface PessoaRepository {
    suspend fun inicializar()

    suspend fun listarTipos(idPais: Long?, tipoPessoa: TipoPessoa?): List<DocumentoTipo>
    suspend fun buscarTipo(id: Long): DocumentoTipo?
    suspend fun inserirTipo(tipo: DocumentoTipo): Long
    suspend fun atualizarTipo(id: Long, tipo: DocumentoTipo): Boolean
    suspend fun excluirTipo(id: Long): Boolean
    suspend fun tipoEmUso(id: Long): Boolean

    suspend fun listarPessoas(): List<PessoaCompleta>
    suspend fun buscarPessoa(id: Long): PessoaCompleta?
    suspend fun inserirPessoa(pessoa: Pessoa, documentos: List<DocumentoNovo>): Long
    suspend fun atualizarPessoa(id: Long, pessoa: Pessoa, documentos: List<DocumentoNovo>): Boolean
    suspend fun excluirPessoa(id: Long): Boolean

    suspend fun buscarPessoaPorTipoUnico(idTipoDocumento: Long, numero: String, ignorarPessoaId: Long? = null): Pessoa?
    suspend fun buscarPessoaPorDocumentoLivre(
        idPais: Long,
        tipoLivre: String,
        numero: String,
        ignorarPessoaId: Long? = null,
    ): Pessoa?

    suspend fun listarClientes(): List<PapelCompleto>
    suspend fun buscarCliente(id: Long): PapelCompleto?
    suspend fun buscarClientePorPessoa(idPessoa: Long): PapelCompleto?
    suspend fun inserirCliente(idPessoa: Long, status: Status): Long
    suspend fun atualizarCliente(id: Long, status: Status): Boolean
    suspend fun excluirCliente(id: Long): Boolean
    suspend fun contarClientes(): Long

    suspend fun listarFornecedores(): List<PapelCompleto>
    suspend fun buscarFornecedor(id: Long): PapelCompleto?
    suspend fun buscarFornecedorPorPessoa(idPessoa: Long): PapelCompleto?
    suspend fun inserirFornecedor(idPessoa: Long, status: Status): Long
    suspend fun atualizarFornecedor(id: Long, status: Status): Boolean
    suspend fun excluirFornecedor(id: Long): Boolean
    suspend fun contarFornecedores(): Long
}
