package com.monarca.pessoa.repository

import com.monarca.empresa.repository.FiliaisTable
import com.monarca.localidade.repository.CidadesTable
import com.monarca.localidade.repository.PaisesTable
import org.jetbrains.exposed.v1.core.dao.id.LongIdTable

object DocumentoTiposTable : LongIdTable("documento_tipo") {
    val idPais = reference("id_pais", PaisesTable)
    val tipoPessoa = varchar("tipo_pessoa", 20)
    val codigo = varchar("codigo", 20)
    val nome = varchar("nome", 80)
    val unico = bool("unico").default(true)

    init {
        uniqueIndex(idPais, codigo)
    }
}

object PessoasTable : LongIdTable("pessoa") {
    val nomeRazaoSocial = varchar("nome_razao_social", 180)
    val tipoPessoa = varchar("tipo_pessoa", 20)
    val ddi = varchar("ddi", 5).nullable()
    val telefone = varchar("telefone", 30).nullable()
    val email = varchar("email", 120).nullable()
    val status = varchar("status", 20).default("ativo")
}

object PessoaEnderecosTable : LongIdTable("pessoa_endereco") {
    val idPessoa = reference("id_pessoa", PessoasTable)
    val tipo = varchar("tipo", 20)
    val principal = bool("principal").default(false)
    val tipoLogradouro = varchar("tipo_logradouro", 30).nullable()
    val logradouro = varchar("logradouro", 180).nullable()
    val numero = varchar("numero", 20).nullable()
    val bairro = varchar("bairro", 80).nullable()
    val cep = varchar("cep", 15).nullable()
    val complemento = varchar("complemento", 80).nullable()
    val idCidade = optReference("id_cidade", CidadesTable)
    val status = varchar("status", 20).default("ativo")
    val idPessoaPrincipal = long("id_pessoa_principal").nullable()
}

object ClientesTable : LongIdTable("cliente") {
    val idPessoa = reference("id_pessoa", PessoasTable)
    val idFilialCadastro = optReference("id_filial_cadastro", FiliaisTable)
    val status = varchar("status", 20).default("ativo")

    init {
        uniqueIndex(idPessoa)
    }
}

object FornecedoresTable : LongIdTable("fornecedor") {
    val idPessoa = reference("id_pessoa", PessoasTable)
    val idFilialCadastro = optReference("id_filial_cadastro", FiliaisTable)
    val status = varchar("status", 20).default("ativo")

    init {
        uniqueIndex(idPessoa)
    }
}

object ClienteFilialTable : LongIdTable("cliente_filial") {
    val idCliente = reference("id_cliente", ClientesTable)
    val idFilial = reference("id_filial", FiliaisTable)
    val status = varchar("status", 20).default("ativo")

    init {
        uniqueIndex(idCliente, idFilial)
    }
}

object FornecedorFilialTable : LongIdTable("fornecedor_filial") {
    val idFornecedor = reference("id_fornecedor", FornecedoresTable)
    val idFilial = reference("id_filial", FiliaisTable)
    val status = varchar("status", 20).default("ativo")

    init {
        uniqueIndex(idFornecedor, idFilial)
    }
}

object PessoaDocumentosTable : LongIdTable("pessoa_documento") {
    val idPessoa = reference("id_pessoa", PessoasTable)
    val idPais = reference("id_pais", PaisesTable)
    val idTipoDocumento = optReference("id_tipo_documento", DocumentoTiposTable)
    val tipoLivre = varchar("tipo_livre", 80).nullable()
    val numero = varchar("numero", 40)
    val status = varchar("status", 20).default("ativo")
}
