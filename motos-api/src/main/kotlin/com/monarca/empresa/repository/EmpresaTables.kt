package com.monarca.empresa.repository

import com.monarca.localidade.repository.CidadesTable
import org.jetbrains.exposed.v1.core.dao.id.LongIdTable

object EmpresasTable : LongIdTable("empresa") {
    val razaoSocial = varchar("razao_social", 180)
    val nomeFantasia = varchar("nome_fantasia", 120)
    val ruc = varchar("ruc", 15)
    val representanteNome = varchar("representante_nome", 120).nullable()
    val representanteDocumento = varchar("representante_documento", 40).nullable()
    val status = varchar("status", 20).default("ativo")
}

object FiliaisTable : LongIdTable("filial") {
    val idEmpresa = reference("id_empresa", EmpresasTable)
    val nome = varchar("nome", 120)
    val ddi = varchar("ddi", 5).nullable()
    val telefone = varchar("telefone", 30).nullable()
    val email = varchar("email", 120).nullable()
    val tipoLogradouro = varchar("tipo_logradouro", 30).nullable()
    val logradouro = varchar("logradouro", 180).nullable()
    val numero = varchar("numero", 20).nullable()
    val bairro = varchar("bairro", 80).nullable()
    val cep = varchar("cep", 15).nullable()
    val complemento = varchar("complemento", 80).nullable()
    val idCidade = optReference("id_cidade", CidadesTable)
    val timbrado = varchar("timbrado", 20).nullable()
    val timbradoVigenciaInicio = varchar("timbrado_vigencia_inicio", 10).nullable()
    val timbradoVigenciaFim = varchar("timbrado_vigencia_fim", 10).nullable()
    val estabelecimentoNumero = varchar("estabelecimento_numero", 10).nullable()
    val pontoExpedicao = varchar("ponto_expedicao", 10).nullable()
    val perfilFiscal = varchar("perfil_fiscal", 30).default("py_iva")
    val moedaOperacao = varchar("moeda_operacao", 3).default("usd")
    val idEstoquePadrao = long("id_estoque_padrao").nullable()
    val principal = bool("principal").default(false)
    val listarApenasClientesFilial = bool("listar_apenas_clientes_filial").default(true)
    val listarApenasFornecedoresFilial = bool("listar_apenas_fornecedores_filial").default(true)
    val listarApenasProdutosFilial = bool("listar_apenas_produtos_filial").default(true)
    val status = varchar("status", 20).default("ativo")
}
