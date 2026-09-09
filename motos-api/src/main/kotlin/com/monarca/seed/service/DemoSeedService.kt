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
import com.monarca.common.enums.Status
import com.monarca.empresa.service.EmpresaService
import com.monarca.estoque.dto.EstoqueProdutoRequest
import com.monarca.estoque.dto.EstoqueRequest
import com.monarca.estoque.service.EstoqueService
import com.monarca.localidade.service.LocalidadeService
import com.monarca.localidade.service.RecursoNaoEncontrado
import com.monarca.pessoa.domain.TipoEndereco
import com.monarca.pessoa.domain.TipoPessoa
import com.monarca.pessoa.dto.DocumentoRequest
import com.monarca.pessoa.dto.EnderecoRequest
import com.monarca.pessoa.dto.PapelRequest
import com.monarca.pessoa.dto.PessoaRequest
import com.monarca.pessoa.service.PapelService
import com.monarca.pessoa.service.PessoaService
import com.monarca.produto.domain.Moeda
import com.monarca.produto.domain.TipoProduto
import com.monarca.produto.dto.MarcaRequest
import com.monarca.produto.dto.ModeloRequest
import com.monarca.produto.dto.ProdutoBicicletaRequest
import com.monarca.produto.dto.ProdutoMotoRequest
import com.monarca.produto.dto.ProdutoRequest
import com.monarca.produto.service.MarcaService
import com.monarca.produto.service.ProdutoService
import com.monarca.seed.dto.SeedDemoStatusResponse
import com.monarca.seed.repository.ExposedDemoSeedRepository
import com.monarca.usuario.Senha
import com.monarca.usuario.SystemUser
import com.monarca.usuario.domain.IdiomaUsuario
import com.monarca.usuario.domain.PerfilUsuario
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

    companion object {
        const val SENHA_DEMO = "demo12345"
    }

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
                .firstOrNull { it.id != caixa2.id }
            ?: caixa2

        val sessao1 = garantirSessao(caixaPrincipal.id, caixaPrincipal.sessaoAbertaId, idDinheiro, idUsuario)
        val sessao2 = garantirSessao(caixa2.id, caixa2.sessaoAbertaId, idDinheiro, idUsuario)

        garantirUsuario("DEMO Operador", "demo.operador", PerfilUsuario.OPERADOR, idFilial, caixaPrincipal.id)
        val idVendedorDemo = garantirUsuario("DEMO Vendedor", "demo.vendedor", PerfilUsuario.VENDEDOR, idFilial, caixaPrincipal.id)

        val estoquesFilial = estoqueService.listar(idFilial, idUsuario)
        val idEstoquePrincipal = estoquesFilial
            .filter { !it.nome.startsWith("DEMO", ignoreCase = true) }
            .minByOrNull { it.id }?.id
            ?: estoquesFilial.minByOrNull { it.id }?.id
            ?: garantirEstoque(idFilial, idUsuario, "DEMO Estoque")

        val marca = marcaService.listar().first { it.nome.equals("Monarca", ignoreCase = true) }
        val idCaloi = garantirMarca("DEMO Caloi")
        val idOggi = garantirMarca("DEMO Oggi")
        val idHonda = garantirMarca("DEMO Honda")
        val idSoco = garantirMarca("DEMO Super Soco")

        val idModeloCity = garantirModelo(marca.id, "DEMO City", TipoProduto.BICICLETA)
        val idModeloTrail = garantirModelo(marca.id, "DEMO Trail", TipoProduto.BICICLETA)
        val idModeloUrbana = garantirModelo(marca.id, "DEMO Urbana", TipoProduto.BICICLETA)
        val idModeloCargo = garantirModelo(marca.id, "DEMO Cargo", TipoProduto.BICICLETA)
        val idModeloScooter = garantirModelo(marca.id, "DEMO Scooter", TipoProduto.MOTO)
        val idModeloAndes = garantirModelo(idCaloi, "DEMO Andes", TipoProduto.BICICLETA)
        val idModeloExplorer = garantirModelo(idCaloi, "DEMO Explorer", TipoProduto.BICICLETA)
        val idModeloHacker = garantirModelo(idOggi, "DEMO Hacker", TipoProduto.BICICLETA)
        val idModeloAgile = garantirModelo(idOggi, "DEMO Agile", TipoProduto.BICICLETA)
        val idModeloCg = garantirModelo(idHonda, "DEMO CG 160", TipoProduto.MOTO)
        val idModeloPop = garantirModelo(idHonda, "DEMO Pop 110", TipoProduto.MOTO)
        val idModeloTc = garantirModelo(idSoco, "DEMO TC Max", TipoProduto.MOTO)
        val idModeloCux = garantirModelo(idSoco, "DEMO CUx", TipoProduto.MOTO)

        val ano = Year.now().value
        val bikeCity = produtoDemo(
            idUsuario, idFilial, idEstoquePrincipal, "DEMO-B01", marca.id, idModeloCity, TipoProduto.BICICLETA,
            Moeda.PYG, 1_500_000.0, 900_000.0, 18,
            bicicleta = ProdutoBicicletaRequest(cor = "Preta", aro = "29", tipoQuadro = "Rígido", numeroMarchas = 21),
        )
        val bikeTrail = produtoDemo(
            idUsuario, idFilial, idEstoquePrincipal, "DEMO-B02", marca.id, idModeloTrail, TipoProduto.BICICLETA,
            Moeda.USD, 450.0, 280.0, 12,
            bicicleta = ProdutoBicicletaRequest(cor = "Verde", aro = "27.5", potenciaMotorW = 250, autonomiaKm = 60),
        )
        val bikeUrbana = produtoDemo(
            idUsuario, idFilial, idEstoquePrincipal, "DEMO-B03", marca.id, idModeloUrbana, TipoProduto.BICICLETA,
            Moeda.PYG, 890_000.0, 520_000.0, 20,
            bicicleta = ProdutoBicicletaRequest(cor = "Azul", aro = "26", tipoQuadro = "Urbano", tipoFreio = "V-Brake"),
        )
        produtoDemo(
            idUsuario, idFilial, idEstoquePrincipal, "DEMO-B04", marca.id, idModeloCargo, TipoProduto.BICICLETA,
            Moeda.BRL, 3_500.0, 2_100.0, 6,
            bicicleta = ProdutoBicicletaRequest(cor = "Laranja", aro = "20", tipoQuadro = "Cargo", pesoKg = 28.0),
        )
        produtoDemo(
            idUsuario, idFilial, idEstoquePrincipal, "DEMO-B05", idCaloi, idModeloAndes, TipoProduto.BICICLETA,
            Moeda.USD, 320.0, 190.0, 15,
            bicicleta = ProdutoBicicletaRequest(cor = "Vermelha", aro = "29", numeroMarchas = 24, tipoFreio = "Disco"),
        )
        produtoDemo(
            idUsuario, idFilial, idEstoquePrincipal, "DEMO-B06", idCaloi, idModeloExplorer, TipoProduto.BICICLETA,
            Moeda.PYG, 2_100_000.0, 1_250_000.0, 9,
            bicicleta = ProdutoBicicletaRequest(cor = "Cinza", aro = "29", potenciaMotorW = 350, autonomiaKm = 80),
        )
        produtoDemo(
            idUsuario, idFilial, idEstoquePrincipal, "DEMO-B07", idOggi, idModeloHacker, TipoProduto.BICICLETA,
            Moeda.USD, 780.0, 490.0, 7,
            bicicleta = ProdutoBicicletaRequest(cor = "Preta", aro = "29", tipoQuadro = "MTB", numeroMarchas = 18),
        )
        produtoDemo(
            idUsuario, idFilial, idEstoquePrincipal, "DEMO-B08", idOggi, idModeloAgile, TipoProduto.BICICLETA,
            Moeda.BRL, 2_200.0, 1_350.0, 11,
            bicicleta = ProdutoBicicletaRequest(cor = "Branca", aro = "700", tipoQuadro = "Speed", tipoFreio = "Disco"),
        )
        val moto = produtoDemo(
            idUsuario, idFilial, idEstoquePrincipal, "DEMO-M01", marca.id, idModeloScooter, TipoProduto.MOTO,
            Moeda.USD, 1_200.0, 780.0, 5,
            moto = ProdutoMotoRequest(chassi = "DEMOCHASSI001", cor = "Branca", anoFabricacao = ano, anoModelo = ano, assentos = 2),
        )
        produtoDemo(
            idUsuario, idFilial, idEstoquePrincipal, "DEMO-M02", idHonda, idModeloCg, TipoProduto.MOTO,
            Moeda.USD, 2_450.0, 1_680.0, 4,
            moto = ProdutoMotoRequest(chassi = "DEMOCHASSI002", cor = "Vermelha", anoFabricacao = ano, anoModelo = ano, tipoFreio = "Disco"),
        )
        produtoDemo(
            idUsuario, idFilial, idEstoquePrincipal, "DEMO-M03", idHonda, idModeloPop, TipoProduto.MOTO,
            Moeda.PYG, 8_900_000.0, 6_200_000.0, 6,
            moto = ProdutoMotoRequest(chassi = "DEMOCHASSI003", cor = "Azul", anoFabricacao = ano, anoModelo = ano, assentos = 2),
        )
        produtoDemo(
            idUsuario, idFilial, idEstoquePrincipal, "DEMO-M04", idSoco, idModeloTc, TipoProduto.MOTO,
            Moeda.USD, 3_100.0, 2_050.0, 3,
            moto = ProdutoMotoRequest(
                chassi = "DEMOCHASSI004", cor = "Preta", anoFabricacao = ano, anoModelo = ano,
                potenciaMotorW = 4000, autonomiaKm = 110, velocidadeMaxKmh = 95,
            ),
        )
        val motoCux = produtoDemo(
            idUsuario, idFilial, idEstoquePrincipal, "DEMO-M05", idSoco, idModeloCux, TipoProduto.MOTO,
            Moeda.BRL, 12_800.0, 8_400.0, 4,
            moto = ProdutoMotoRequest(chassi = "DEMOCHASSI005", cor = "Cinza", anoFabricacao = ano, anoModelo = ano, autonomiaKm = 70),
        )

        val idPatio = garantirEstoque(idFilial, idUsuario, "DEMO Pátio")
        setEstoque(idPatio, bikeUrbana, 4, idFilial, idUsuario)
        setEstoque(idPatio, motoCux, 2, idFilial, idUsuario)

        val py = localidadeService.listarPaises().first { it.sigla.equals("PY", ignoreCase = true) }
        val tipoCi = pessoaService.listarTipos(py.id, TipoPessoa.FISICA).first { it.codigo.equals("CI", ignoreCase = true) }
        val tipoRuc = pessoaService.listarTipos(py.id, TipoPessoa.JURIDICA).first { it.codigo.equals("RUC", ignoreCase = true) }
        val idCidade = localidadeService.listarCidades(py.id, null)
            .firstOrNull { it.nome.contains("Asunci", ignoreCase = true) }?.id
            ?: localidadeService.listarCidades(py.id, null).firstOrNull()?.id

        val ana = clienteDemo(idUsuario, idFilial, "DEMO Ana Pereira", TipoPessoa.FISICA, py.id, tipoCi.id, "4500123", "981111222", idCidade, "Mariscal López", "1200")
        val carlos = clienteDemo(idUsuario, idFilial, "DEMO Carlos Benítez", TipoPessoa.FISICA, py.id, tipoCi.id, "4500456", "982333444", idCidade, "España", "890")
        val comercio = clienteDemo(idUsuario, idFilial, "DEMO Comercio Sur", TipoPessoa.JURIDICA, py.id, tipoRuc.id, ruc("8001234"), "213334455", idCidade, "Av. San Martín", "450")
        clienteDemo(idUsuario, idFilial, "DEMO Lucia Ferreira", TipoPessoa.FISICA, py.id, tipoCi.id, "4510789", "983555666", idCidade, "Peru", "210")
        clienteDemo(idUsuario, idFilial, "DEMO João Silva", TipoPessoa.FISICA, py.id, tipoCi.id, "4521111", "984777888", idCidade, "Brasil", "55")
        clienteDemo(idUsuario, idFilial, "DEMO Maria Gómez", TipoPessoa.FISICA, py.id, tipoCi.id, "4532222", "985111000", idCidade, "Colombia", "330")
        clienteDemo(idUsuario, idFilial, "DEMO Pedro Núñez", TipoPessoa.FISICA, py.id, tipoCi.id, "4543333", "986222111", idCidade, "Mcal. Estigarribia", "78")
        clienteDemo(idUsuario, idFilial, "DEMO Bike Center PY", TipoPessoa.JURIDICA, py.id, tipoRuc.id, ruc("8002345"), "216667788", idCidade, "Aviadores del Chaco", "1600")

        fornecedorDemo(idUsuario, idFilial, "DEMO Peças Leste", TipoPessoa.JURIDICA, py.id, tipoRuc.id, ruc("8003456"), "214445566", idCidade, "Ruta 2", "km 8")
        fornecedorDemo(idUsuario, idFilial, "DEMO Importadora Norte", TipoPessoa.JURIDICA, py.id, tipoRuc.id, ruc("8004567"), "217778899", idCidade, "Eusebio Ayala", "3200")
        fornecedorDemo(idUsuario, idFilial, "DEMO Oficina Central", TipoPessoa.JURIDICA, py.id, tipoRuc.id, ruc("8005678"), "219990011", idCidade, "Defensores del Chaco", "12")

        val cotacao = cotacaoService.buscarHoje()
        val city = produtoService.buscar(bikeCity, idFilial, idUsuario)
        val trail = produtoService.buscar(bikeTrail, idFilial, idUsuario)
        val motoProd = produtoService.buscar(moto, idFilial, idUsuario)
        val totalCity = paraPyg(city.precoLista, city.moedaPreco, cotacao.usdPyg, cotacao.brlPyg)
        val totalTrail = paraPyg(trail.precoLista, trail.moedaPreco, cotacao.usdPyg, cotacao.brlPyg)
        val totalMoto = paraPyg(motoProd.precoLista, motoProd.moedaPreco, cotacao.usdPyg, cotacao.brlPyg)

        val venda1 = vendaService.criar(
            VendaRequest(
                idFilial = idFilial,
                idCliente = ana,
                idCaixaSessao = sessao1,
                itens = listOf(VendaItemRequest(idProduto = bikeCity, quantidade = 1)),
                negociacao = listOf(VendaNegociacaoRequest(idFinalizador = idDinheiro, valor = totalCity)),
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
                idVendedor = idVendedorDemo,
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
                conferencia = listOf(
                    ValorFinalizadorRequest(idFinalizador = idDinheiro, valor = 1_000_000.0),
                    ValorFinalizadorRequest(idFinalizador = idDinheiro, valor = 80.0, moeda = Moeda.USD),
                ),
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

    private suspend fun garantirMarca(nome: String): Long {
        val existente = marcaService.listar().find { it.nome.equals(nome, ignoreCase = true) }
        val id = existente?.id ?: marcaService.criar(MarcaRequest(nome = nome)).id
        marcadores.marcar("marca", id)
        return id
    }

    private suspend fun garantirModelo(idMarca: Long, nome: String, tipo: TipoProduto): Long {
        val existente = marcaService.listarModelos(idMarca, tipo).find { it.nome.equals(nome, ignoreCase = true) }
        val id = existente?.id ?: marcaService.criarModelo(ModeloRequest(idMarca = idMarca, nome = nome, tipo = tipo)).id
        marcadores.marcar("modelo", id)
        return id
    }

    private suspend fun garantirUsuario(
        nome: String,
        login: String,
        perfil: PerfilUsuario,
        idFilial: Long,
        idCaixaPadrao: Long,
    ): Long {
        val existente = usuarioRepository.buscarPorLogin(login)
        val id = if (existente != null) {
            existente.id
        } else {
            val criado = usuarioRepository.inserir(
                nome = nome,
                login = login,
                email = "$login@demo.monarca",
                senhaHash = Senha.hash(SENHA_DEMO),
                perfil = perfil,
                idioma = IdiomaUsuario.PT,
                status = Status.ATIVO,
            )
            usuarioRepository.substituirFiliais(criado, listOf(idFilial))
            caixaService.substituirAcessosUsuario(criado, null, idCaixaPadrao)
            criado
        }
        marcadores.marcar("usuario", id)
        return id
    }

    private suspend fun garantirEstoque(idFilial: Long, idUsuario: Long, nome: String): Long {
        val existente = estoqueService.listar(idFilial, idUsuario).find { it.nome.equals(nome, ignoreCase = true) }
        val estoque = existente ?: estoqueService.criar(EstoqueRequest(idFilial = idFilial, nome = nome), idUsuario)
        marcadores.marcar("estoque", estoque.id)
        return estoque.id
    }

    private suspend fun produtoDemo(
        idUsuario: Long,
        idFilial: Long,
        idEstoque: Long,
        codigo: String,
        idMarca: Long,
        idModelo: Long,
        tipo: TipoProduto,
        moeda: Moeda,
        preco: Double,
        custo: Double,
        estoque: Int,
        bicicleta: ProdutoBicicletaRequest? = null,
        moto: ProdutoMotoRequest? = null,
    ): Long {
        val lista = produtoService.listar(idFilial, null, idUsuario)
        val existente = lista.find { it.codigo.equals(codigo, ignoreCase = true) }
        val filial = empresaService.buscarFilial(idFilial)
        val cotacao = cotacaoService.buscarHoje()
        val precoOp = converterMoeda(preco, moeda, filial.moedaOperacao, cotacao.usdPyg, cotacao.brlPyg)
        val custoOp = converterMoeda(custo, moeda, filial.moedaOperacao, cotacao.usdPyg, cotacao.brlPyg)
        val produto = existente ?: produtoService.criar(
            ProdutoRequest(
                codigo = codigo,
                idMarca = idMarca,
                idModelo = idModelo,
                tipo = tipo,
                idFilialCadastro = idFilial,
                moedaPreco = filial.moedaOperacao,
                precoLista = precoOp,
                custo = custoOp,
                moto = moto,
                bicicleta = bicicleta,
            ),
            idUsuario,
        )
        marcadores.marcar("produto", produto.id)
        setEstoque(idEstoque, produto.id, estoque, idFilial, idUsuario)
        return produto.id
    }

    private suspend fun setEstoque(idEstoque: Long, idProduto: Long, quantidade: Int, idFilial: Long, idUsuario: Long) {
        val item = estoqueService.listarItens(idEstoque, idFilial, idUsuario)
            .find { it.idProduto == idProduto } ?: return
        estoqueService.atualizarItem(
            item.id,
            EstoqueProdutoRequest(
                idEstoque = item.idEstoque,
                idProduto = item.idProduto,
                quantidade = quantidade,
                quantidadeReservada = 0,
            ),
            idUsuario,
        )
    }

    private suspend fun clienteDemo(
        idUsuario: Long,
        idFilial: Long,
        nome: String,
        tipo: TipoPessoa,
        idPais: Long,
        idTipo: Long,
        numero: String,
        telefone: String,
        idCidade: Long?,
        logradouro: String,
        numeroEndereco: String,
    ): Long {
        val existente = papelService.listarClientes(idFilial, idUsuario)
            .find { it.pessoa.nomeRazaoSocial.equals(nome, ignoreCase = true) }
        val cliente = existente ?: papelService.criarCliente(
            PapelRequest(
                idFilialCadastro = idFilial,
                pessoa = pessoaDemo(nome, tipo, idPais, idTipo, numero, telefone, idCidade, logradouro, numeroEndereco),
            ),
            idUsuario,
        )
        marcadores.marcar("cliente", cliente.id)
        marcadores.marcar("pessoa", cliente.idPessoa)
        return cliente.id
    }

    private suspend fun fornecedorDemo(
        idUsuario: Long,
        idFilial: Long,
        nome: String,
        tipo: TipoPessoa,
        idPais: Long,
        idTipo: Long,
        numero: String,
        telefone: String,
        idCidade: Long?,
        logradouro: String,
        numeroEndereco: String,
    ): Long {
        val existente = papelService.listarFornecedores(idFilial, idUsuario)
            .find { it.pessoa.nomeRazaoSocial.equals(nome, ignoreCase = true) }
        val fornecedor = existente ?: papelService.criarFornecedor(
            PapelRequest(
                idFilialCadastro = idFilial,
                pessoa = pessoaDemo(nome, tipo, idPais, idTipo, numero, telefone, idCidade, logradouro, numeroEndereco),
            ),
            idUsuario,
        )
        marcadores.marcar("fornecedor", fornecedor.id)
        marcadores.marcar("pessoa", fornecedor.idPessoa)
        return fornecedor.id
    }

    private fun pessoaDemo(
        nome: String,
        tipo: TipoPessoa,
        idPais: Long,
        idTipo: Long,
        numero: String,
        telefone: String,
        idCidade: Long?,
        logradouro: String,
        numeroEndereco: String,
    ) = PessoaRequest(
        nomeRazaoSocial = nome,
        tipoPessoa = tipo,
        ddi = "595",
        telefone = telefone,
        email = "${numero.filter { it.isDigit() }}@demo.monarca",
        enderecos = listOf(
            EnderecoRequest(
                tipo = TipoEndereco.FISCAL,
                principal = true,
                tipoLogradouro = "Av.",
                logradouro = logradouro,
                numero = numeroEndereco,
                bairro = "Centro",
                idCidade = idCidade,
            ),
        ),
        documentos = listOf(
            DocumentoRequest(idPais = idPais, idTipoDocumento = idTipo, numero = numero),
        ),
    )

    private fun paraPyg(valor: Double, moeda: Moeda, usdPyg: Double, brlPyg: Double): Double =
        converterMoeda(valor, moeda, Moeda.PYG, usdPyg, brlPyg)

    private fun converterMoeda(valor: Double, de: Moeda, para: Moeda, usdPyg: Double, brlPyg: Double): Double {
        if (de == para) return if (para == Moeda.PYG) round(valor) else valor
        val pyg = when (de) {
            Moeda.PYG -> valor
            Moeda.USD -> valor * usdPyg
            Moeda.BRL -> valor * brlPyg
        }
        return when (para) {
            Moeda.PYG -> round(pyg)
            Moeda.USD -> round(pyg / usdPyg * 100.0) / 100.0
            Moeda.BRL -> round(pyg / brlPyg * 100.0) / 100.0
        }
    }

    private fun ruc(base: String): String {
        var k = 2
        var total = 0
        for (c in base.reversed()) {
            if (k > 11) k = 2
            total += (c - '0') * k
            k++
        }
        val resto = total % 11
        val dv = if (resto > 1) 11 - resto else 0
        return "$base-$dv"
    }

    private suspend fun marcarMovimentosNovos(idSessao: Long, idUsuario: Long) {
        caixaService.listarMovimentacoes(idSessao, idUsuario)
            .filter { it.idVenda != null }
            .forEach { marcadores.marcar("caixa_movimentacao", it.id) }
    }
}
