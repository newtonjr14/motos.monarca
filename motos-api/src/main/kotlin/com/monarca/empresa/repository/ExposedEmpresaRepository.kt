package com.monarca.empresa.repository

import com.monarca.common.enums.Status
import com.monarca.empresa.domain.Empresa
import com.monarca.empresa.domain.Filial
import com.monarca.empresa.domain.FilialDetalhe
import com.monarca.localidade.repository.CidadesTable
import com.monarca.localidade.repository.DivisoesTable
import com.monarca.localidade.repository.PaisesTable
import com.monarca.pessoa.repository.ClienteFilialTable
import com.monarca.pessoa.repository.ClientesTable
import com.monarca.pessoa.repository.FornecedorFilialTable
import com.monarca.pessoa.repository.FornecedoresTable
import com.monarca.produto.repository.ProdutoFilialTable
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

class ExposedEmpresaRepository(
    private val database: R2dbcDatabase,
) : EmpresaRepository {

    override suspend fun listarEmpresas(): List<Empresa> = suspendTransaction(database) {
        EmpresasTable.selectAll()
            .where { EmpresasTable.status neq Status.DELETADO.name.lowercase() }
            .orderBy(EmpresasTable.razaoSocial to SortOrder.ASC)
            .map { it.toEmpresa() }
            .toList()
    }

    override suspend fun buscarEmpresa(id: Long): Empresa? = suspendTransaction(database) {
        EmpresasTable.selectAll()
            .where {
                (EmpresasTable.id eq id) and (EmpresasTable.status neq Status.DELETADO.name.lowercase())
            }
            .map { it.toEmpresa() }
            .singleOrNull()
    }

    override suspend fun existeEmpresaPorRuc(ruc: String, ignorarId: Long?): Boolean =
        suspendTransaction(database) {
            val idExistente = EmpresasTable.selectAll()
                .where {
                    (EmpresasTable.ruc eq ruc) and (EmpresasTable.status neq Status.DELETADO.name.lowercase())
                }
                .map { it[EmpresasTable.id].value }
                .singleOrNull()
            idExistente != null && idExistente != ignorarId
        }

    override suspend fun inserirEmpresa(empresa: Empresa): Long = suspendTransaction(database) {
        val inserted = EmpresasTable.insert {
            it[razaoSocial] = empresa.razaoSocial
            it[nomeFantasia] = empresa.nomeFantasia
            it[ruc] = empresa.ruc
            it[representanteNome] = empresa.representanteNome
            it[representanteDocumento] = empresa.representanteDocumento
            it[status] = empresa.status.name.lowercase()
        }
        inserted[EmpresasTable.id].value
    }

    override suspend fun atualizarEmpresa(id: Long, empresa: Empresa): Boolean = suspendTransaction(database) {
        EmpresasTable.update({
            (EmpresasTable.id eq id) and (EmpresasTable.status neq Status.DELETADO.name.lowercase())
        }) {
            it[razaoSocial] = empresa.razaoSocial
            it[nomeFantasia] = empresa.nomeFantasia
            it[ruc] = empresa.ruc
            it[representanteNome] = empresa.representanteNome
            it[representanteDocumento] = empresa.representanteDocumento
            it[status] = empresa.status.name.lowercase()
        } > 0
    }

    override suspend fun excluirEmpresa(id: Long): Boolean = suspendTransaction(database) {
        EmpresasTable.update({
            (EmpresasTable.id eq id) and (EmpresasTable.status neq Status.DELETADO.name.lowercase())
        }) {
            it[status] = Status.DELETADO.name.lowercase()
        } > 0
    }

    override suspend fun listarFiliais(idEmpresa: Long?): List<FilialDetalhe> = suspendTransaction(database) {
        queryFiliais()
            .where {
                val porEmpresa = if (idEmpresa != null) FiliaisTable.idEmpresa eq idEmpresa else Op.TRUE
                porEmpresa and filiaisNaoDeletadas()
            }
            .orderBy(FiliaisTable.nome to SortOrder.ASC)
            .map { it.toFilialDetalhe() }
            .toList()
    }

    override suspend fun buscarFilial(id: Long): FilialDetalhe? = suspendTransaction(database) {
        queryFiliais()
            .where { (FiliaisTable.id eq id) and filiaisNaoDeletadas() }
            .map { it.toFilialDetalhe() }
            .singleOrNull()
    }

    override suspend fun buscarFilialPrincipal(): FilialDetalhe? = suspendTransaction(database) {
        queryFiliais()
            .where { (FiliaisTable.principal eq true) and filiaisNaoDeletadas() }
            .map { it.toFilialDetalhe() }
            .singleOrNull()
    }

    override suspend fun inserirFilial(filial: Filial): Long = suspendTransaction(database) {
        val inserted = FiliaisTable.insert {
            it[idEmpresa] = filial.idEmpresa
            it[nome] = filial.nome
            it[ddi] = filial.ddi
            it[telefone] = filial.telefone
            it[email] = filial.email
            it[tipoLogradouro] = filial.tipoLogradouro
            it[logradouro] = filial.logradouro
            it[numero] = filial.numero
            it[bairro] = filial.bairro
            it[cep] = filial.cep
            it[complemento] = filial.complemento
            it[idCidade] = filial.idCidade
            it[timbrado] = filial.timbrado
            it[timbradoVigenciaInicio] = filial.timbradoVigenciaInicio
            it[timbradoVigenciaFim] = filial.timbradoVigenciaFim
            it[estabelecimentoNumero] = filial.estabelecimentoNumero
            it[pontoExpedicao] = filial.pontoExpedicao
            it[principal] = filial.principal
            it[listarApenasClientesFilial] = filial.listarApenasClientesFilial
            it[listarApenasFornecedoresFilial] = filial.listarApenasFornecedoresFilial
            it[listarApenasProdutosFilial] = filial.listarApenasProdutosFilial
            it[status] = filial.status.name.lowercase()
        }
        inserted[FiliaisTable.id].value
    }

    override suspend fun atualizarFilial(id: Long, filial: Filial): Boolean = suspendTransaction(database) {
        FiliaisTable.update({
            (FiliaisTable.id eq id) and (FiliaisTable.status neq Status.DELETADO.name.lowercase())
        }) {
            it[idEmpresa] = filial.idEmpresa
            it[nome] = filial.nome
            it[ddi] = filial.ddi
            it[telefone] = filial.telefone
            it[email] = filial.email
            it[tipoLogradouro] = filial.tipoLogradouro
            it[logradouro] = filial.logradouro
            it[numero] = filial.numero
            it[bairro] = filial.bairro
            it[cep] = filial.cep
            it[complemento] = filial.complemento
            it[idCidade] = filial.idCidade
            it[timbrado] = filial.timbrado
            it[timbradoVigenciaInicio] = filial.timbradoVigenciaInicio
            it[timbradoVigenciaFim] = filial.timbradoVigenciaFim
            it[estabelecimentoNumero] = filial.estabelecimentoNumero
            it[pontoExpedicao] = filial.pontoExpedicao
            it[principal] = filial.principal
            it[listarApenasClientesFilial] = filial.listarApenasClientesFilial
            it[listarApenasFornecedoresFilial] = filial.listarApenasFornecedoresFilial
            it[listarApenasProdutosFilial] = filial.listarApenasProdutosFilial
            it[status] = filial.status.name.lowercase()
        } > 0
    }

    override suspend fun excluirFilial(id: Long): Boolean = suspendTransaction(database) {
        FiliaisTable.update({
            (FiliaisTable.id eq id) and (FiliaisTable.status neq Status.DELETADO.name.lowercase())
        }) {
            it[status] = Status.DELETADO.name.lowercase()
            it[principal] = false
        } > 0
    }

    override suspend fun limparPrincipal(idEmpresa: Long, excetoId: Long?) {
        suspendTransaction(database) {
            FiliaisTable.update({
                val exceto = if (excetoId != null) FiliaisTable.id neq excetoId else Op.TRUE
                (FiliaisTable.idEmpresa eq idEmpresa) and exceto and filialAtiva()
            }) {
                it[principal] = false
            }
        }
    }

    override suspend fun filialEmUso(id: Long): Boolean = suspendTransaction(database) {
        val emCliente = ClienteFilialTable.selectAll()
            .where {
                (ClienteFilialTable.idFilial eq id) and
                    (ClienteFilialTable.status neq Status.DELETADO.name.lowercase())
            }
            .toList()
            .isNotEmpty()
        if (emCliente) return@suspendTransaction true
        val emFornecedor = FornecedorFilialTable.selectAll()
            .where {
                (FornecedorFilialTable.idFilial eq id) and
                    (FornecedorFilialTable.status neq Status.DELETADO.name.lowercase())
            }
            .toList()
            .isNotEmpty()
        if (emFornecedor) return@suspendTransaction true
        ProdutoFilialTable.selectAll()
            .where {
                (ProdutoFilialTable.idFilial eq id) and
                    (ProdutoFilialTable.status neq Status.DELETADO.name.lowercase())
            }
            .toList()
            .isNotEmpty()
    }

    private fun queryFiliais() = FiliaisTable
        .innerJoin(EmpresasTable)
        .leftJoin(CidadesTable)
        .leftJoin(DivisoesTable)
        .leftJoin(PaisesTable)
        .selectAll()

    private fun filialAtiva() = FiliaisTable.status neq Status.DELETADO.name.lowercase()

    private fun filiaisNaoDeletadas() =
        filialAtiva() and (EmpresasTable.status neq Status.DELETADO.name.lowercase())

    private fun ResultRow.toEmpresa() = Empresa(
        id = this[EmpresasTable.id].value,
        razaoSocial = this[EmpresasTable.razaoSocial],
        nomeFantasia = this[EmpresasTable.nomeFantasia],
        ruc = this[EmpresasTable.ruc],
        representanteNome = this[EmpresasTable.representanteNome],
        representanteDocumento = this[EmpresasTable.representanteDocumento],
        status = Status.valueOf(this[EmpresasTable.status].uppercase()),
    )

    private fun ResultRow.toFilial() = Filial(
        id = this[FiliaisTable.id].value,
        idEmpresa = this[FiliaisTable.idEmpresa].value,
        nome = this[FiliaisTable.nome],
        ddi = this[FiliaisTable.ddi],
        telefone = this[FiliaisTable.telefone],
        email = this[FiliaisTable.email],
        tipoLogradouro = this[FiliaisTable.tipoLogradouro],
        logradouro = this[FiliaisTable.logradouro],
        numero = this[FiliaisTable.numero],
        bairro = this[FiliaisTable.bairro],
        cep = this[FiliaisTable.cep],
        complemento = this[FiliaisTable.complemento],
        idCidade = this[FiliaisTable.idCidade]?.value,
        timbrado = this[FiliaisTable.timbrado],
        timbradoVigenciaInicio = this[FiliaisTable.timbradoVigenciaInicio],
        timbradoVigenciaFim = this[FiliaisTable.timbradoVigenciaFim],
        estabelecimentoNumero = this[FiliaisTable.estabelecimentoNumero],
        pontoExpedicao = this[FiliaisTable.pontoExpedicao],
        principal = this[FiliaisTable.principal],
        listarApenasClientesFilial = this[FiliaisTable.listarApenasClientesFilial],
        listarApenasFornecedoresFilial = this[FiliaisTable.listarApenasFornecedoresFilial],
        listarApenasProdutosFilial = this[FiliaisTable.listarApenasProdutosFilial],
        status = Status.valueOf(this[FiliaisTable.status].uppercase()),
    )

    private fun ResultRow.toFilialDetalhe() = FilialDetalhe(
        filial = toFilial(),
        empresaRazaoSocial = this[EmpresasTable.razaoSocial],
        empresaNomeFantasia = this[EmpresasTable.nomeFantasia],
        cidadeNome = getOrNull(CidadesTable.nome),
        divisaoNome = getOrNull(DivisoesTable.nome),
        divisaoSigla = getOrNull(DivisoesTable.sigla),
        paisNome = getOrNull(PaisesTable.nome),
    )
}
