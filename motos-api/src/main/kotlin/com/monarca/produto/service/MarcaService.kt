package com.monarca.produto.service

import com.monarca.Texto
import com.monarca.common.enums.Status
import com.monarca.localidade.service.RecursoNaoEncontrado
import com.monarca.localidade.service.invalido
import com.monarca.produto.domain.Marca
import com.monarca.produto.domain.Modelo
import com.monarca.produto.domain.ModeloDetalhe
import com.monarca.produto.domain.TipoProduto
import com.monarca.produto.dto.MarcaRequest
import com.monarca.produto.dto.MarcaResponse
import com.monarca.produto.dto.ModeloRequest
import com.monarca.produto.dto.ModeloResponse
import com.monarca.produto.repository.MarcaRepository

class MarcaService(
    private val repository: MarcaRepository,
) {

    suspend fun listar(): List<MarcaResponse> = repository.listar().map { it.toResponse() }

    suspend fun buscar(id: Long): MarcaResponse =
        repository.buscar(id)?.toResponse() ?: throw RecursoNaoEncontrado("Marca $id não encontrada")

    suspend fun criar(request: MarcaRequest): MarcaResponse {
        val marca = validarMarca(request, 0)
        if (repository.existeNome(marca.nome)) {
            throw invalido("MARCA_NOME_DUPLICADO", "Já existe uma marca com o nome ${marca.nome}", "nome" to marca.nome)
        }
        val id = repository.inserir(marca)
        return buscar(id)
    }

    suspend fun atualizar(id: Long, request: MarcaRequest): MarcaResponse {
        repository.buscar(id) ?: throw RecursoNaoEncontrado("Marca $id não encontrada")
        val marca = validarMarca(request, id)
        if (repository.existeNome(marca.nome, ignorarId = id)) {
            throw invalido("MARCA_NOME_DUPLICADO", "Já existe uma marca com o nome ${marca.nome}", "nome" to marca.nome)
        }
        repository.atualizar(id, marca)
        repository.atualizarNomesProdutosDaMarca(id)
        return buscar(id)
    }

    suspend fun excluir(id: Long) {
        repository.buscar(id) ?: throw RecursoNaoEncontrado("Marca $id não encontrada")
        if (repository.temModelos(id)) {
            throw invalido("MARCA_COM_MODELOS", "Não é possível excluir uma marca que possui modelos")
        }
        if (!repository.excluir(id)) {
            throw RecursoNaoEncontrado("Marca $id não encontrada")
        }
    }

    suspend fun listarModelos(idMarca: Long?, tipo: TipoProduto?): List<ModeloResponse> =
        repository.listarModelos(idMarca, tipo).map { it.toResponse() }

    suspend fun buscarModelo(id: Long): ModeloResponse =
        repository.buscarModelo(id)?.toResponse() ?: throw RecursoNaoEncontrado("Modelo $id não encontrado")

    suspend fun criarModelo(request: ModeloRequest): ModeloResponse {
        val modelo = validarModelo(request, 0)
        if (repository.existeNomeModelo(modelo.idMarca, modelo.nome)) {
            throw invalido("MODELO_NOME_DUPLICADO", "Já existe um modelo com o nome ${modelo.nome} nesta marca", "nome" to modelo.nome)
        }
        val id = repository.inserirModelo(modelo)
        return buscarModelo(id)
    }

    suspend fun atualizarModelo(id: Long, request: ModeloRequest): ModeloResponse {
        val atual = repository.buscarModelo(id) ?: throw RecursoNaoEncontrado("Modelo $id não encontrado")
        if (request.tipo != atual.modelo.tipo && repository.temProdutos(id)) {
            throw invalido("MODELO_TIPO_COM_PRODUTOS", "Não é possível alterar o tipo de um modelo que possui produtos")
        }
        val modelo = validarModelo(request, id)
        if (repository.existeNomeModelo(modelo.idMarca, modelo.nome, ignorarId = id)) {
            throw invalido("MODELO_NOME_DUPLICADO", "Já existe um modelo com o nome ${modelo.nome} nesta marca", "nome" to modelo.nome)
        }
        repository.atualizarModelo(id, modelo)
        repository.sincronizarMarcaDosProdutos(id, modelo.idMarca)
        return buscarModelo(id)
    }

    suspend fun excluirModelo(id: Long) {
        repository.buscarModelo(id) ?: throw RecursoNaoEncontrado("Modelo $id não encontrado")
        if (repository.temProdutos(id)) {
            throw invalido("MODELO_COM_PRODUTOS", "Não é possível excluir um modelo que possui produtos")
        }
        if (!repository.excluirModelo(id)) {
            throw RecursoNaoEncontrado("Modelo $id não encontrado")
        }
    }

    private suspend fun validarMarca(request: MarcaRequest, id: Long): Marca {
        val nome = validarTexto(request.nome, "Nome")
        return Marca(id = id, nome = nome, status = validarStatus(request.status))
    }

    private suspend fun validarModelo(request: ModeloRequest, id: Long): Modelo {
        repository.buscar(request.idMarca) ?: throw RecursoNaoEncontrado("Marca ${request.idMarca} não encontrada")
        val nome = validarTexto(request.nome, "Nome")
        return Modelo(
            id = id,
            idMarca = request.idMarca,
            nome = nome,
            tipo = request.tipo,
            status = validarStatus(request.status),
        )
    }

    private fun validarTexto(valor: String, rotulo: String): String {
        val trimmed = valor.trim()
        if (trimmed.isEmpty()) throw invalido("CAMPO_OBRIGATORIO", "$rotulo é obrigatório")
        return Texto.titleCase(trimmed)
    }

    private fun validarStatus(status: Status): Status {
        if (status == Status.DELETADO) throw invalido("USE_DELETE", "Use DELETE para marcar como deletado")
        return status
    }

    private fun Marca.toResponse() = MarcaResponse(id = id, nome = nome, status = status)

    private fun ModeloDetalhe.toResponse() = ModeloResponse(
        id = modelo.id,
        idMarca = modelo.idMarca,
        marcaNome = marcaNome,
        nome = modelo.nome,
        tipo = modelo.tipo,
        status = modelo.status,
    )
}
