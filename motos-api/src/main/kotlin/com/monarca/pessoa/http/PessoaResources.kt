package com.monarca.pessoa.http

import com.monarca.pessoa.domain.TipoPessoa
import io.ktor.resources.Resource
import kotlinx.serialization.Serializable

@Serializable
@Resource("/pessoas")
class Pessoas {
    @Serializable
    @Resource("{id}")
    class Id(val parent: Pessoas = Pessoas(), val id: Long)
}

@Serializable
@Resource("/documentos-tipos")
class DocumentosTipos(
    val idPais: Long? = null,
    val tipoPessoa: TipoPessoa? = null,
) {
    @Serializable
    @Resource("{id}")
    class Id(val parent: DocumentosTipos = DocumentosTipos(), val id: Long)
}

@Serializable
@Resource("/clientes")
class Clientes(
    val idFilial: Long? = null,
) {
    @Serializable
    @Resource("{id}")
    class Id(val parent: Clientes = Clientes(), val id: Long)
}

@Serializable
@Resource("/fornecedores")
class Fornecedores(
    val idFilial: Long? = null,
) {
    @Serializable
    @Resource("{id}")
    class Id(val parent: Fornecedores = Fornecedores(), val id: Long)
}
