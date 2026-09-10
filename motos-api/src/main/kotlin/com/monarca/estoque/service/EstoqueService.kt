package com.monarca.estoque.service

import com.monarca.Texto
import com.monarca.common.enums.Status
import com.monarca.empresa.service.EmpresaService
import com.monarca.estoque.domain.Estoque
import com.monarca.estoque.domain.EstoqueDetalhe
import com.monarca.estoque.domain.EstoqueProduto
import com.monarca.estoque.domain.EstoqueProdutoDetalhe
import com.monarca.estoque.dto.EstoqueProdutoRequest
import com.monarca.estoque.dto.EstoqueProdutoResponse
import com.monarca.estoque.dto.EstoqueRequest
import com.monarca.estoque.dto.EstoqueResponse
import com.monarca.estoque.repository.EstoqueRepository
import com.monarca.localidade.service.RecursoNaoEncontrado
import com.monarca.localidade.service.acesso
import com.monarca.localidade.service.invalido
import com.monarca.produto.repository.ProdutoRepository
import com.monarca.usuario.repository.UsuarioRepository

class EstoqueService(
    private val repository: EstoqueRepository,
    private val produtoRepository: ProdutoRepository,
    private val empresaService: EmpresaService,
    private val usuarioRepository: UsuarioRepository,
) {

    suspend fun listar(idFilial: Long?, idUsuario: Long): List<EstoqueResponse> {
        val filial = resolverFilialComAcesso(idUsuario, idFilial)
        return repository.listar(filial).map { it.toResponse() }
    }

    suspend fun buscar(id: Long, idUsuario: Long): EstoqueResponse {
        val detalhe = repository.buscar(id) ?: throw RecursoNaoEncontrado("Estoque $id não encontrado")
        exigirAcessoFilial(idUsuario, detalhe.estoque.idFilial)
        return detalhe.toResponse()
    }

    suspend fun criar(request: EstoqueRequest, idUsuario: Long): EstoqueResponse {
        val idFilial = resolverFilialComAcesso(idUsuario, request.idFilial)
        val estoque = validarEstoque(request, 0, idFilial)
        if (repository.existeNome(idFilial, estoque.nome)) {
            throw invalido("ESTOQUE_NOME_DUPLICADO", "Já existe um estoque com o nome ${estoque.nome} nesta filial", "nome" to estoque.nome)
        }
        val id = repository.inserir(estoque)
        empresaService.garantirEstoquePadrao(idFilial, id)
        return buscar(id, idUsuario)
    }

    suspend fun atualizar(id: Long, request: EstoqueRequest, idUsuario: Long): EstoqueResponse {
        val atual = repository.buscar(id) ?: throw RecursoNaoEncontrado("Estoque $id não encontrado")
        exigirAcessoFilial(idUsuario, atual.estoque.idFilial)
        val idFilial = resolverFilialComAcesso(idUsuario, request.idFilial ?: atual.estoque.idFilial)
        val estoque = validarEstoque(request, id, idFilial)
        if (repository.existeNome(idFilial, estoque.nome, ignorarId = id)) {
            throw invalido("ESTOQUE_NOME_DUPLICADO", "Já existe um estoque com o nome ${estoque.nome} nesta filial", "nome" to estoque.nome)
        }
        val filial = empresaService.buscarFilial(idFilial)
        if (filial.idEstoquePadrao == id && estoque.status != Status.ATIVO) {
            throw invalido("ESTOQUE_PADRAO_INATIVO", "O estoque padrão da venda precisa estar ativo")
        }
        repository.atualizar(id, estoque)
        return buscar(id, idUsuario)
    }

    suspend fun excluir(id: Long, idUsuario: Long) {
        val atual = repository.buscar(id) ?: throw RecursoNaoEncontrado("Estoque $id não encontrado")
        exigirAcessoFilial(idUsuario, atual.estoque.idFilial)
        if (repository.temItens(id)) {
            throw invalido("ESTOQUE_COM_PRODUTOS", "Não é possível excluir um estoque que possui produtos")
        }
        if (!repository.excluir(id)) {
            throw RecursoNaoEncontrado("Estoque $id não encontrado")
        }
        empresaService.reporEstoquePadrao(atual.estoque.idFilial, id)
    }

    suspend fun listarItens(idEstoque: Long?, idFilial: Long?, idUsuario: Long): List<EstoqueProdutoResponse> {
        if (idEstoque != null) {
            val estoque = repository.buscar(idEstoque) ?: throw RecursoNaoEncontrado("Estoque $idEstoque não encontrado")
            exigirAcessoFilial(idUsuario, estoque.estoque.idFilial)
            return repository.listarItens(idEstoque).map { it.toResponse() }
        }
        val filial = resolverFilialComAcesso(idUsuario, idFilial)
        return repository.listarItensPorFilial(filial).map { it.toResponse() }
    }

    suspend fun buscarItem(id: Long, idUsuario: Long): EstoqueProdutoResponse {
        val item = repository.buscarItem(id) ?: throw RecursoNaoEncontrado("Item de estoque $id não encontrado")
        exigirAcessoFilial(idUsuario, item.idFilial)
        return item.toResponse()
    }

    suspend fun criarItem(request: EstoqueProdutoRequest, idUsuario: Long): EstoqueProdutoResponse {
        val item = validarItem(request, 0)
        val estoque = repository.buscar(item.idEstoque) ?: throw RecursoNaoEncontrado("Estoque ${item.idEstoque} não encontrado")
        exigirAcessoFilial(idUsuario, estoque.estoque.idFilial)
        produtoRepository.buscar(item.idProduto) ?: throw RecursoNaoEncontrado("Produto ${item.idProduto} não encontrado")
        val existente = repository.buscarItemPorEstoqueProduto(item.idEstoque, item.idProduto)
        val id = when {
            existente == null -> repository.inserirItem(item)
            existente.item.status == Status.DELETADO -> {
                repository.atualizarItem(existente.item.id, item.copy(id = existente.item.id))
                existente.item.id
            }
            else -> throw invalido("ESTOQUE_PRODUTO_DUPLICADO", "Este produto já está neste estoque")
        }
        return buscarItem(id, idUsuario)
    }

    suspend fun atualizarItem(id: Long, request: EstoqueProdutoRequest, idUsuario: Long): EstoqueProdutoResponse {
        val atual = repository.buscarItem(id) ?: throw RecursoNaoEncontrado("Item de estoque $id não encontrado")
        exigirAcessoFilial(idUsuario, atual.idFilial)
        val item = validarItem(request, id)
        val estoque = repository.buscar(item.idEstoque) ?: throw RecursoNaoEncontrado("Estoque ${item.idEstoque} não encontrado")
        exigirAcessoFilial(idUsuario, estoque.estoque.idFilial)
        produtoRepository.buscar(item.idProduto) ?: throw RecursoNaoEncontrado("Produto ${item.idProduto} não encontrado")
        repository.atualizarItem(id, item)
        return buscarItem(id, idUsuario)
    }

    suspend fun excluirItem(id: Long, idUsuario: Long) {
        val atual = repository.buscarItem(id) ?: throw RecursoNaoEncontrado("Item de estoque $id não encontrado")
        exigirAcessoFilial(idUsuario, atual.idFilial)
        if (!repository.excluirItem(id)) {
            throw RecursoNaoEncontrado("Item de estoque $id não encontrado")
        }
    }

    private fun validarEstoque(request: EstoqueRequest, id: Long, idFilial: Long): Estoque {
        val nome = request.nome.trim().let { Texto.titleCase(it) }
        if (nome.isEmpty()) throw invalido("ESTOQUE_NOME_OBRIGATORIO", "Nome do estoque é obrigatório")
        val status = validarStatus(request.status)
        return Estoque(id = id, idFilial = idFilial, nome = nome, status = status)
    }

    private fun validarItem(request: EstoqueProdutoRequest, id: Long): EstoqueProduto {
        if (request.quantidade < 0) throw invalido("QTD_NEGATIVA", "Quantidade não pode ser negativa")
        if (request.quantidadeReservada < 0) throw invalido("QTD_RESERVADA_NEGATIVA", "Quantidade reservada não pode ser negativa")
        if (request.quantidadeReservada > request.quantidade) {
            throw invalido("QTD_RESERVADA_MAIOR", "Quantidade reservada não pode ser maior que a quantidade")
        }
        val status = validarStatus(request.status)
        return EstoqueProduto(
            id = id,
            idEstoque = request.idEstoque,
            idProduto = request.idProduto,
            quantidade = request.quantidade,
            quantidadeReservada = request.quantidadeReservada,
            status = status,
        )
    }

    private fun validarStatus(status: Status): Status {
        if (status == Status.DELETADO) throw invalido("USE_DELETE", "Use DELETE para marcar como deletado")
        return status
    }

    private suspend fun resolverFilialComAcesso(idUsuario: Long, idFilial: Long?): Long {
        val resolvida = empresaService.resolverFilialCadastro(idFilial)
        exigirAcessoFilial(idUsuario, resolvida)
        return resolvida
    }

    private suspend fun exigirAcessoFilial(idUsuario: Long, idFilial: Long?) {
        val resolvida = idFilial ?: empresaService.buscarFilialPrincipal().id
        if (!usuarioRepository.temAcessoFilial(idUsuario, resolvida)) {
            throw acesso("SEM_ACESSO_FILIAL", "Sem acesso à filial")
        }
    }

    private fun EstoqueDetalhe.toResponse() = EstoqueResponse(
        id = estoque.id,
        idFilial = estoque.idFilial,
        filialNome = filialNome,
        nome = estoque.nome,
        status = estoque.status,
    )

    private fun EstoqueProdutoDetalhe.toResponse() = EstoqueProdutoResponse(
        id = item.id,
        idEstoque = item.idEstoque,
        estoqueNome = estoqueNome,
        idFilial = idFilial,
        filialNome = filialNome,
        idProduto = item.idProduto,
        produtoCodigo = produtoCodigo,
        produtoNome = produtoNome,
        produtoTipo = produtoTipo,
        quantidade = item.quantidade,
        quantidadeReservada = item.quantidadeReservada,
        quantidadeDisponivel = item.quantidade - item.quantidadeReservada,
        status = item.status,
    )
}
