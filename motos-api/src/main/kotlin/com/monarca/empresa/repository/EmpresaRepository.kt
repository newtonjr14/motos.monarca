package com.monarca.empresa.repository

import com.monarca.common.enums.Status
import com.monarca.empresa.domain.Empresa
import com.monarca.empresa.domain.Filial
import com.monarca.empresa.domain.FilialDetalhe

interface EmpresaRepository {
    suspend fun listarEmpresas(): List<Empresa>
    suspend fun buscarEmpresa(id: Long): Empresa?
    suspend fun existeEmpresaPorRuc(ruc: String, ignorarId: Long? = null): Boolean
    suspend fun inserirEmpresa(empresa: Empresa): Long
    suspend fun atualizarEmpresa(id: Long, empresa: Empresa): Boolean
    suspend fun excluirEmpresa(id: Long): Boolean

    suspend fun listarFiliais(idEmpresa: Long? = null): List<FilialDetalhe>
    suspend fun buscarFilial(id: Long): FilialDetalhe?
    suspend fun buscarFilialPrincipal(): FilialDetalhe?
    suspend fun inserirFilial(filial: Filial): Long
    suspend fun atualizarFilial(id: Long, filial: Filial): Boolean
    suspend fun excluirFilial(id: Long): Boolean
    suspend fun limparPrincipal(idEmpresa: Long, excetoId: Long? = null): Unit
    suspend fun filialEmUso(id: Long): Boolean
}
