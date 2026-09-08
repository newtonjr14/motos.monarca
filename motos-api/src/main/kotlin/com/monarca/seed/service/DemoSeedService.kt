package com.monarca.seed.service

import com.monarca.caixa.domain.TipoFinalizador
import com.monarca.caixa.dto.AbrirSessaoRequest
import com.monarca.caixa.dto.CaixaRequest
import com.monarca.caixa.dto.FinalizadorRequest
import com.monarca.caixa.dto.TransferenciaCaixaRequest
import com.monarca.caixa.dto.ValorFinalizadorRequest
import com.monarca.caixa.service.CaixaService
import com.monarca.cotacao.dto.CotacaoRequest
import com.monarca.cotacao.service.CotacaoService
import com.monarca.empresa.service.EmpresaService
import com.monarca.estoque.dto.EstoqueProdutoRequest
import com.monarca.estoque.service.EstoqueService
import com.monarca.localidade.service.LocalidadeService
import com.monarca.localidade.service.RecursoNaoEncontrado
import com.monarca.pessoa.domain.TipoPessoa
import com.monarca.pessoa.dto.DocumentoRequest
import com.monarca.pessoa.dto.PapelRequest
import com.monarca.pessoa.dto.PessoaRequest
import com.monarca.pessoa.service.PapelService
import com.monarca.pessoa.service.PessoaService
import com.monarca.produto.domain.Moeda
import com.monarca.produto.domain.TipoProduto
import com.monarca.produto.dto.ModeloRequest
import com.monarca.produto.dto.ProdutoBicicletaRequest
import com.monarca.produto.dto.ProdutoMotoRequest
import com.monarca.produto.dto.ProdutoRequest
import com.monarca.produto.service.MarcaService
import com.monarca.produto.service.ProdutoService
import com.monarca.seed.dto.SeedDemoStatusResponse
import com.monarca.seed.repository.ExposedDemoSeedRepository
import com.monarca.usuario.SystemUser
import com.monarca.usuario.repository.UsuarioRepository
import com.monarca.venda.dto.VendaItemRequest
import com.monarca.venda.dto.VendaNegociacaoRequest
import com.monarca.venda.dto.VendaRequest
import com.monarca.venda.service.VendaService
import java.time.Year
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlin.math.round

class DemoSeedService(
    private val marcadores: ExposedDemoSeedRepository,
    private val usuarioRepository: UsuarioRepository,
    private val empresaService: EmpresaService,
    private val localidadeService: LocalidadeService,
    private val pessoaService: PessoaService,
    private val papelService: PapelService,
    private val marcaService: MarcaService,
    private val produtoService: ProdutoService,
    private val estoqueService: EstoqueService,
    private val cotacaoService: CotacaoService,
    private val caixaService: CaixaService,
    private val vendaService: VendaService,
) {
    private val mutex = Mutex()

    suspend fun status(): SeedDemoStatusResponse = marcadores.status()

    suspend fun aplicar(): SeedDemoStatusResponse = mutex.withLock {
        if (marcadores.aplicado()) return marcadores.status()
        try {
            popular()
        } catch (e: Exception) {
            runCatching { marcadores.removerMarcados() }
            throw e
        }
        marcadores.status()
    }

    suspend fun remover(): SeedDemoStatusResponse = mutex.withLock {
        marcadores.removerMarcados()
        marcadores.status()
    }

    private suspend fun popular() {
        val usuario = usuarioRepository.buscarPorLogin(SystemUser.LOGIN)
            ?: throw RecursoNaoEncontrado("Usuário system não encontrado")
        val idUsuario = usuario.id
        val idFilial = empresaService.buscarFilialPrincipal().id

        if (!cotacaoService.temHoje()) {
            cotacaoService.criar(
                CotacaoRequest(data = cotacaoService.dataHoje(), usdPyg = 7_300.0, brlPyg = 1_400.0),
            )
        }

        val finalizadores = caixaService.listarFinalizadores()
        val idDinheiro = finalizadores.first { it.nome.equals("Dinheiro", ignoreCase = true) }.id
        val idCartao = finalizadores.first { it.nome.equals("Cartão", ignoreCase = true) }.id
        val idDeposito = finalizadores.first { it.nome.equals("Depósito", ignoreCase = true) }.id
        val cheque = finalizadores.find { it.nome.equals("DEMO Cheque", ignoreCase = true) }
            ?: caixaService.criarFinalizador(FinalizadorRequest(nome = "DEMO Cheque", tipo = TipoFinalizador.CHEQUE))
        marcadores.marcar("finalizador", cheque.id)

        val caixas = caixaService.listarCaixas(idFilial, idUsuario, somenteComAcesso = false)
        val caixa2 = caixas.find { it.nome.equals("DEMO Caixa 2", ignoreCase = true) }
            ?: caixaService.criarCaixa(CaixaRequest(idFilial = idFilial, nome = "DEMO Caixa 2"), idUsuario)
        marcadores.marcar("caixa", caixa2.id)
        val caixaPrincipal = caixas.find { it.id != caixa2.id && it.nome.equals("Caixa 1", ignoreCase = true) }
            ?: caixaService.listarCaixas(idFilial, idUsuario, somenteComAcesso = false)
                .first { it.id != caixa2.id }

        val sessao1 = garantirSessao(caixaPrincipal.id, caixaPrincipal.sessaoAbertaId, idDinheiro, idUsuario)
        val sessao2 = garantirSessao(caixa2.id, caixa2.sessaoAbertaId, idDinheiro, idUsuario)

        val marca = marcaService.listar().first { it.nome.equals("Monarca", ignoreCase = true) }
        val idModeloCity = garantirModelo(marca.id, "DEMO City", TipoProduto.BICICLETA)
        val idModeloTrail = garantirModelo(marca.id, "DEMO Trail", TipoProduto.BICICLETA)
        val idModeloScooter = garantirModelo(marca.id, "DEMO Scooter", TipoProduto.MOTO)

        val ano = Year.now().value
        val bikeCity = garantirProduto(
            idUsuario = idUsuario,
            idFilial = idFilial,
            codigo = "DEMO-B01",
            idMarca = marca.id,
            idModelo = idModeloCity,
            tipo = TipoProduto.BICICLETA,
            moeda = Moeda.PYG,
            preco = 1_500_000.0,
            custo = 900_000.0,
            bicicleta = ProdutoBicicletaRequest(cor = "Preta", aro = "29", tipoQuadro = "Rígido"),
            estoque = 12,
        )
        val bikeTrail = garantirProduto(
            idUsuario = idUsuario,
            idFilial = idFilial,
            codigo = "DEMO-B02",
            idMarca = marca.id,
            idModelo = idModeloTrail,
            tipo = TipoProduto.BICICLETA,
            moeda = Moeda.USD,
            preco = 450.0,
            custo = 280.0,
            bicicleta = ProdutoBicicletaRequest(cor = "Verde", aro = "27.5", potenciaMotorW = 250),
            estoque = 8,
        )
        val moto = garantirProduto(
            idUsuario = idUsuario,
            idFilial = idFilial,
            codigo = "DEMO-M01",
            idMarca = marca.id,
            idModelo = idModeloScooter,
            tipo = TipoProduto.MOTO,
            moeda = Moeda.USD,
            preco = 1_200.0,
            custo = 780.0,
            moto = ProdutoMotoRequest(
                chassi = "DEMOCHASSI001",
                cor = "Branca",
                anoFabricacao = ano,
                anoModelo = ano,
            ),
            estoque = 3,
        )

        val py = localidadeService.listarPaises().first { it.sigla.equals("PY", ignoreCase = true) }
        val tipoCi = pessoaService.listarTipos(py.id, TipoPessoa.FISICA).first { it.codigo.equals("CI", ignoreCase = true) }
        val tipoRuc = pessoaService.listarTipos(py.id, TipoPessoa.JURIDICA).first { it.codigo.equals("RUC", ignoreCase = true) }

        val ana = garantirCliente(
            idUsuario = idUsuario,
            idFilial = idFilial,
            nome = "DEMO Ana Pereira",
            tipo = TipoPessoa.FISICA,
            idPais = py.id,
            idTipo = tipoCi.id,
            numero = "4500123",
        )
        val carlos = garantirCliente(
            idUsuario = idUsuario,
            idFilial = idFilial,
            nome = "DEMO Carlos Benítez",
            tipo = TipoPessoa.FISICA,
            idPais = py.id,
            idTipo = tipoCi.id,
            numero = "4500456",
        )
        val comercio = garantirCliente(
            idUsuario = idUsuario,
            idFilial = idFilial,
            nome = "DEMO Comercio Sur",
            tipo = TipoPessoa.JURIDICA,
            idPais = py.id,
            idTipo = tipoRuc.id,
            numero = "8001234-5",
        )

        val usd = cotacaoService.buscarHoje().usdPyg
        val totalTrail = round(450.0 * usd)
        val totalMoto = round(1_200.0 * usd)

        val venda1 = vendaService.criar(
            VendaRequest(
                idFilial = idFilial,
                idCliente = ana,
                idCaixaSessao = sessao1,
                itens = listOf(VendaItemRequest(idProduto = bikeCity, quantidade = 1)),
                negociacao = listOf(VendaNegociacaoRequest(idFinalizador = idDinheiro, valor = 1_500_000.0)),
                observacao = "[DEMO]",
            ),
            idUsuario,
        )
        marcadores.marcar("venda", venda1.id)

        val venda2 = vendaService.criar(
            VendaRequest(
                idFilial = idFilial,
                idCliente = carlos,
                idCaixaSessao = sessao1,
                itens = listOf(VendaItemRequest(idProduto = bikeTrail, quantidade = 1)),
                negociacao = listOf(
                    VendaNegociacaoRequest(idFinalizador = idDinheiro, valor = 1_000_000.0),
                    VendaNegociacaoRequest(idFinalizador = idCartao, valor = totalTrail - 1_000_000.0),
                ),
                observacao = "[DEMO]",
            ),
            idUsuario,
        )
        marcadores.marcar("venda", venda2.id)

        val venda3 = vendaService.criar(
            VendaRequest(
                idFilial = idFilial,
                idCliente = comercio,
                idCaixaSessao = sessao1,
                itens = listOf(VendaItemRequest(idProduto = moto, quantidade = 1)),
                negociacao = listOf(VendaNegociacaoRequest(idFinalizador = idDeposito, valor = totalMoto)),
                observacao = "[DEMO]",
            ),
            idUsuario,
        )
        marcadores.marcar("venda", venda3.id)

        marcarMovimentosNovos(sessao1, idUsuario)
        marcarMovimentosNovos(sessao2, idUsuario)

        val antesOrigem = caixaService.listarMovimentacoes(sessao1, idUsuario).map { it.id }.toSet()
        val antesDestino = caixaService.listarMovimentacoes(sessao2, idUsuario).map { it.id }.toSet()
        caixaService.transferir(
            sessao1,
            TransferenciaCaixaRequest(
                idCaixaDestino = caixa2.id,
                conferencia = listOf(ValorFinalizadorRequest(idFinalizador = idDinheiro, valor = 200_000.0)),
                observacao = "[DEMO]",
            ),
            idUsuario,
        )
        caixaService.listarMovimentacoes(sessao1, idUsuario)
            .filter { it.id !in antesOrigem }
            .forEach { marcadores.marcar("caixa_movimentacao", it.id) }
        caixaService.listarMovimentacoes(sessao2, idUsuario)
            .filter { it.id !in antesDestino }
            .forEach { marcadores.marcar("caixa_movimentacao", it.id) }
    }

    private suspend fun garantirSessao(
        idCaixa: Long,
        sessaoAbertaId: Long?,
        idDinheiro: Long,
        idUsuario: Long,
    ): Long {
        if (sessaoAbertaId != null) return sessaoAbertaId
        val sessao = caixaService.abrirSessao(
            AbrirSessaoRequest(
                idCaixa = idCaixa,
                conferencia = listOf(ValorFinalizadorRequest(idFinalizador = idDinheiro, valor = 1_000_000.0)),
                observacao = "[DEMO]",
            ),
            idUsuario,
        )
        marcadores.marcar("caixa_sessao", sessao.id)
        caixaService.listarMovimentacoes(sessao.id, idUsuario).forEach {
            marcadores.marcar("caixa_movimentacao", it.id)
        }
        return sessao.id
    }

    private suspend fun garantirModelo(idMarca: Long, nome: String, tipo: TipoProduto): Long {
        val existente = marcaService.listarModelos(idMarca, tipo).find { it.nome.equals(nome, ignoreCase = true) }
        val id = existente?.id ?: marcaService.criarModelo(ModeloRequest(idMarca = idMarca, nome = nome, tipo = tipo)).id
        marcadores.marcar("modelo", id)
        return id
    }

    private suspend fun garantirProduto(
        idUsuario: Long,
        idFilial: Long,
        codigo: String,
        idMarca: Long,
        idModelo: Long,
        tipo: TipoProduto,
        moeda: Moeda,
        preco: Double,
        custo: Double,
        bicicleta: ProdutoBicicletaRequest? = null,
        moto: ProdutoMotoRequest? = null,
        estoque: Int,
    ): Long {
        val lista = produtoService.listar(idFilial, tipo, idUsuario)
        val existente = lista.find { it.codigo.equals(codigo, ignoreCase = true) }
        val produto = existente ?: produtoService.criar(
            ProdutoRequest(
                codigo = codigo,
                idMarca = idMarca,
                idModelo = idModelo,
                tipo = tipo,
                idFilialCadastro = idFilial,
                moedaPreco = moeda,
                precoLista = preco,
                custo = custo,
                moto = moto,
                bicicleta = bicicleta,
            ),
            idUsuario,
        )
        marcadores.marcar("produto", produto.id)
        val ficha = produtoService.buscar(produto.id, idFilial, idUsuario)
        val saldo = ficha.estoques.firstOrNull() ?: return produto.id
        val item = estoqueService.listarItens(saldo.idEstoque, idFilial, idUsuario)
            .first { it.idProduto == produto.id }
        estoqueService.atualizarItem(
            item.id,
            EstoqueProdutoRequest(
                idEstoque = item.idEstoque,
                idProduto = item.idProduto,
                quantidade = estoque,
                quantidadeReservada = 0,
            ),
            idUsuario,
        )
        return produto.id
    }

    private suspend fun garantirCliente(
        idUsuario: Long,
        idFilial: Long,
        nome: String,
        tipo: TipoPessoa,
        idPais: Long,
        idTipo: Long,
        numero: String,
    ): Long {
        val existente = papelService.listarClientes(idFilial, idUsuario)
            .find { it.pessoa.nomeRazaoSocial.equals(nome, ignoreCase = true) }
        val cliente = existente ?: papelService.criarCliente(
            PapelRequest(
                idFilialCadastro = idFilial,
                pessoa = PessoaRequest(
                    nomeRazaoSocial = nome,
                    tipoPessoa = tipo,
                    documentos = listOf(
                        DocumentoRequest(idPais = idPais, idTipoDocumento = idTipo, numero = numero),
                    ),
                ),
            ),
            idUsuario,
        )
        marcadores.marcar("cliente", cliente.id)
        marcadores.marcar("pessoa", cliente.idPessoa)
        return cliente.id
    }

    private suspend fun marcarMovimentosNovos(idSessao: Long, idUsuario: Long) {
        caixaService.listarMovimentacoes(idSessao, idUsuario)
            .filter { it.idVenda != null }
            .forEach { marcadores.marcar("caixa_movimentacao", it.id) }
    }
}
