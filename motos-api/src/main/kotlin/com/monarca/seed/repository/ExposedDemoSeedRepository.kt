package com.monarca.seed.repository

import com.monarca.caixa.repository.CaixaMovimentacaoFinalizadoresTable
import com.monarca.caixa.repository.CaixaMovimentacoesTable
import com.monarca.caixa.repository.CaixaSessoesTable
import com.monarca.caixa.repository.CaixasTable
import com.monarca.caixa.repository.FinalizadoresTable
import com.monarca.caixa.repository.UsuarioCaixasTable
import com.monarca.common.enums.Status
import com.monarca.estoque.repository.EstoqueProdutosTable
import com.monarca.estoque.repository.EstoquesTable
import com.monarca.pessoa.repository.ClienteFilialTable
import com.monarca.pessoa.repository.ClientesTable
import com.monarca.pessoa.repository.FornecedorFilialTable
import com.monarca.pessoa.repository.FornecedoresTable
import com.monarca.pessoa.repository.PessoaDocumentosTable
import com.monarca.pessoa.repository.PessoaEnderecosTable
import com.monarca.pessoa.repository.PessoasTable
import com.monarca.produto.repository.MarcasTable
import com.monarca.produto.repository.ModelosTable
import com.monarca.produto.repository.ProdutoBicicletasTable
import com.monarca.produto.repository.ProdutoFilialTable
import com.monarca.produto.repository.ProdutoMotosTable
import com.monarca.produto.repository.ProdutoUnidadesTable
import com.monarca.produto.repository.ProdutosTable
import com.monarca.seed.dto.SeedDemoStatusResponse
import com.monarca.usuario.repository.UsuarioFiliaisTable
import com.monarca.usuario.repository.UsuariosTable
import com.monarca.venda.repository.VendaItemUnidadesTable
import com.monarca.venda.repository.VendaItensTable
import com.monarca.venda.repository.VendaNegociacoesTable
import com.monarca.venda.repository.VendasTable
import kotlinx.coroutines.flow.toList
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.inList
import org.jetbrains.exposed.v1.r2dbc.R2dbcDatabase
import org.jetbrains.exposed.v1.r2dbc.deleteWhere
import org.jetbrains.exposed.v1.r2dbc.insert
import org.jetbrains.exposed.v1.r2dbc.selectAll
import org.jetbrains.exposed.v1.r2dbc.transactions.suspendTransaction
import org.jetbrains.exposed.v1.r2dbc.update

class ExposedDemoSeedRepository(
    private val database: R2dbcDatabase,
) {
    suspend fun status(): SeedDemoStatusResponse = suspendTransaction(database) {
        SeedDemoStatusResponse(
            habilitado = true,
            aplicado = temMarcador(),
            clientes = contar("cliente"),
            fornecedores = contar("fornecedor"),
            produtos = contar("produto"),
            vendas = contar("venda"),
            caixas = contar("caixa"),
            finalizadores = contar("finalizador"),
            usuarios = contar("usuario"),
            marcas = contar("marca"),
            estoques = contar("estoque"),
        )
    }

    suspend fun aplicado(): Boolean = suspendTransaction(database) { temMarcador() }

    suspend fun marcar(entidade: String, id: Long) = suspendTransaction(database) {
        val ja = SeedDemoMarcadoresTable.selectAll()
            .where {
                (SeedDemoMarcadoresTable.entidade eq entidade) and
                    (SeedDemoMarcadoresTable.idEntidade eq id)
            }
            .toList()
            .isNotEmpty()
        if (ja) return@suspendTransaction
        SeedDemoMarcadoresTable.insert {
            it[SeedDemoMarcadoresTable.entidade] = entidade
            it[idEntidade] = id
        }
    }

    suspend fun removerMarcados() = suspendTransaction(database) {
        val vendas = idsDe("venda")
        val movimentos = idsDe("caixa_movimentacao")
        val sessoes = idsDe("caixa_sessao")
        val caixas = idsDe("caixa")
        val finalizadores = idsDe("finalizador")
        val produtos = idsDe("produto")
        val modelos = idsDe("modelo")
        val clientes = idsDe("cliente")
        val pessoas = idsDe("pessoa")

        if (vendas.isNotEmpty()) {
            val itens = VendaItensTable.selectAll()
                .where { VendaItensTable.idVenda inList vendas }
                .toList()
            for (item in itens) {
                val idEstoque = item[VendaItensTable.idEstoque].value
                val idProduto = item[VendaItensTable.idProduto].value
                val qtd = item[VendaItensTable.quantidade]
                val saldo = EstoqueProdutosTable.selectAll()
                    .where {
                        (EstoqueProdutosTable.idEstoque eq idEstoque) and
                            (EstoqueProdutosTable.idProduto eq idProduto)
                    }
                    .toList()
                    .singleOrNull()
                if (saldo != null) {
                    val atual = saldo[EstoqueProdutosTable.quantidade]
                    EstoqueProdutosTable.update({ EstoqueProdutosTable.id eq saldo[EstoqueProdutosTable.id].value }) {
                        it[quantidade] = atual + qtd
                    }
                }
            }
        }

        val movsVenda = if (vendas.isEmpty()) {
            emptyList()
        } else {
            CaixaMovimentacoesTable.selectAll()
                .where { CaixaMovimentacoesTable.idVenda inList vendas }
                .toList()
                .map { it[CaixaMovimentacoesTable.id].value }
        }
        val todosMovs = (movimentos + movsVenda).distinct()
        if (todosMovs.isNotEmpty()) {
            CaixaMovimentacaoFinalizadoresTable.deleteWhere {
                CaixaMovimentacaoFinalizadoresTable.idCaixaMovimentacao inList todosMovs
            }
            CaixaMovimentacoesTable.deleteWhere { CaixaMovimentacoesTable.id inList todosMovs }
        }
        if (vendas.isNotEmpty()) {
            val itemIds = VendaItensTable.selectAll()
                .where { VendaItensTable.idVenda inList vendas }
                .toList()
                .map { it[VendaItensTable.id].value }
            if (itemIds.isNotEmpty()) {
                ProdutoUnidadesTable.update({ ProdutoUnidadesTable.idVendaItem inList itemIds }) {
                    it[idVendaItem] = null
                }
                VendaItemUnidadesTable.deleteWhere { VendaItemUnidadesTable.idVendaItem inList itemIds }
            }
            VendaNegociacoesTable.deleteWhere { VendaNegociacoesTable.idVenda inList vendas }
            VendaItensTable.deleteWhere { VendaItensTable.idVenda inList vendas }
            VendasTable.deleteWhere { VendasTable.id inList vendas }
        }

        for (idSessao in sessoes) {
            val restam = CaixaMovimentacoesTable.selectAll()
                .where { CaixaMovimentacoesTable.idCaixaSessao eq idSessao }
                .toList()
            if (restam.isEmpty()) {
                CaixaSessoesTable.deleteWhere { CaixaSessoesTable.id eq idSessao }
            }
        }

        if (caixas.isNotEmpty()) {
            UsuarioCaixasTable.deleteWhere { UsuarioCaixasTable.idCaixa inList caixas }
            for (idCaixa in caixas) {
                val temSessao = CaixaSessoesTable.selectAll()
                    .where { CaixaSessoesTable.idCaixa eq idCaixa }
                    .toList()
                    .isNotEmpty()
                if (temSessao) {
                    CaixasTable.update({ CaixasTable.id eq idCaixa }) {
                        it[status] = Status.DELETADO.name.lowercase()
                    }
                } else {
                    CaixasTable.deleteWhere { CaixasTable.id eq idCaixa }
                }
            }
        }

        if (finalizadores.isNotEmpty()) {
            val emNegociacao = VendaNegociacoesTable.selectAll()
                .where { VendaNegociacoesTable.idFinalizador inList finalizadores }
                .toList()
                .map { it[VendaNegociacoesTable.idFinalizador].value }
                .toSet()
            val emMov = CaixaMovimentacaoFinalizadoresTable.selectAll()
                .where { CaixaMovimentacaoFinalizadoresTable.idFinalizador inList finalizadores }
                .toList()
                .map { it[CaixaMovimentacaoFinalizadoresTable.idFinalizador].value }
                .toSet()
            val emUso = emNegociacao + emMov
            val livres = finalizadores.filter { it !in emUso }
            val presos = finalizadores.filter { it in emUso }
            if (livres.isNotEmpty()) {
                FinalizadoresTable.deleteWhere { FinalizadoresTable.id inList livres }
            }
            for (id in presos) {
                FinalizadoresTable.update({ FinalizadoresTable.id eq id }) {
                    it[status] = Status.DELETADO.name.lowercase()
                }
            }
        }

        if (produtos.isNotEmpty()) {
            val emVenda = VendaItensTable.selectAll()
                .where { VendaItensTable.idProduto inList produtos }
                .toList()
                .map { it[VendaItensTable.idProduto].value }
                .toSet()
            val livres = produtos.filter { it !in emVenda }
            val presos = produtos.filter { it in emVenda }
            if (livres.isNotEmpty()) {
                ProdutoUnidadesTable.deleteWhere { ProdutoUnidadesTable.idProduto inList livres }
                EstoqueProdutosTable.deleteWhere { EstoqueProdutosTable.idProduto inList livres }
                ProdutoFilialTable.deleteWhere { ProdutoFilialTable.idProduto inList livres }
                ProdutoMotosTable.deleteWhere { ProdutoMotosTable.idProduto inList livres }
                ProdutoBicicletasTable.deleteWhere { ProdutoBicicletasTable.idProduto inList livres }
                ProdutosTable.deleteWhere { ProdutosTable.id inList livres }
            }
            for (id in presos) {
                ProdutosTable.update({ ProdutosTable.id eq id }) {
                    it[status] = Status.DELETADO.name.lowercase()
                }
            }
        }

        if (modelos.isNotEmpty()) {
            val comProduto = ProdutosTable.selectAll()
                .where { ProdutosTable.idModelo inList modelos }
                .toList()
                .map { it[ProdutosTable.idModelo].value }
                .toSet()
            val livres = modelos.filter { it !in comProduto }
            if (livres.isNotEmpty()) {
                ModelosTable.deleteWhere { ModelosTable.id inList livres }
            }
        }

        val marcas = idsDe("marca")
        if (marcas.isNotEmpty()) {
            val comModelo = ModelosTable.selectAll()
                .where { ModelosTable.idMarca inList marcas }
                .toList()
                .map { it[ModelosTable.idMarca].value }
                .toSet()
            val livres = marcas.filter { it !in comModelo }
            if (livres.isNotEmpty()) {
                MarcasTable.deleteWhere { MarcasTable.id inList livres }
            }
        }

        if (clientes.isNotEmpty()) {
            val emVenda = VendasTable.selectAll()
                .where { VendasTable.idCliente inList clientes }
                .toList()
                .map { it[VendasTable.idCliente].value }
                .toSet()
            val livres = clientes.filter { it !in emVenda }
            val presos = clientes.filter { it in emVenda }
            if (livres.isNotEmpty()) {
                ClienteFilialTable.deleteWhere { ClienteFilialTable.idCliente inList livres }
                ClientesTable.deleteWhere { ClientesTable.id inList livres }
            }
            for (id in presos) {
                ClientesTable.update({ ClientesTable.id eq id }) {
                    it[status] = Status.DELETADO.name.lowercase()
                }
            }
        }

        val fornecedores = idsDe("fornecedor")
        if (fornecedores.isNotEmpty()) {
            FornecedorFilialTable.deleteWhere { FornecedorFilialTable.idFornecedor inList fornecedores }
            FornecedoresTable.deleteWhere { FornecedoresTable.id inList fornecedores }
        }

        if (pessoas.isNotEmpty()) {
            val aindaCliente = ClientesTable.selectAll()
                .where { ClientesTable.idPessoa inList pessoas }
                .toList()
                .map { it[ClientesTable.idPessoa].value }
                .toSet()
            val aindaFornecedor = FornecedoresTable.selectAll()
                .where { FornecedoresTable.idPessoa inList pessoas }
                .toList()
                .map { it[FornecedoresTable.idPessoa].value }
                .toSet()
            val livres = pessoas.filter { it !in aindaCliente && it !in aindaFornecedor }
            if (livres.isNotEmpty()) {
                PessoaEnderecosTable.deleteWhere { PessoaEnderecosTable.idPessoa inList livres }
                PessoaDocumentosTable.deleteWhere { PessoaDocumentosTable.idPessoa inList livres }
                PessoasTable.deleteWhere { PessoasTable.id inList livres }
            }
        }

        val estoques = idsDe("estoque")
        if (estoques.isNotEmpty()) {
            EstoqueProdutosTable.deleteWhere { EstoqueProdutosTable.idEstoque inList estoques }
            EstoquesTable.deleteWhere { EstoquesTable.id inList estoques }
        }

        val usuarios = idsDe("usuario")
        if (usuarios.isNotEmpty()) {
            UsuarioCaixasTable.deleteWhere { UsuarioCaixasTable.idUsuario inList usuarios }
            UsuarioFiliaisTable.deleteWhere { UsuarioFiliaisTable.idUsuario inList usuarios }
            UsuariosTable.deleteWhere { UsuariosTable.id inList usuarios }
        }

        SeedDemoMarcadoresTable.deleteWhere { SeedDemoMarcadoresTable.entidade eq SeedDemoMarcadoresTable.entidade }
    }

    private suspend fun temMarcador(): Boolean =
        SeedDemoMarcadoresTable.selectAll().toList().isNotEmpty()

    private suspend fun contar(entidade: String): Int =
        SeedDemoMarcadoresTable.selectAll()
            .where { SeedDemoMarcadoresTable.entidade eq entidade }
            .toList()
            .size

    private suspend fun idsDe(entidade: String): List<Long> =
        SeedDemoMarcadoresTable.selectAll()
            .where { SeedDemoMarcadoresTable.entidade eq entidade }
            .toList()
            .map { it[SeedDemoMarcadoresTable.idEntidade] }
}
