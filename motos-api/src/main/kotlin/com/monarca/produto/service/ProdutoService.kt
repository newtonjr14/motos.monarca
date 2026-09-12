package com.monarca.produto.service

import com.monarca.Texto
import com.monarca.common.enums.Status
import com.monarca.empresa.service.EmpresaService
import com.monarca.localidade.service.RecursoNaoEncontrado
import com.monarca.localidade.service.acesso
import com.monarca.localidade.service.invalido
import com.monarca.pessoa.domain.FilialVinculo
import com.monarca.pessoa.dto.FilialVinculoResponse
import com.monarca.produto.ChassiIntervaloGrande
import com.monarca.produto.ChassiIntervaloInvalido
import com.monarca.produto.ChassiNumeros
import com.monarca.produto.domain.Moeda
import com.monarca.produto.domain.Produto
import com.monarca.produto.domain.ProdutoBicicleta
import com.monarca.produto.domain.ProdutoCompleto
import com.monarca.produto.domain.ProdutoEstoqueSaldo
import com.monarca.produto.domain.ProdutoMoto
import com.monarca.produto.domain.ProdutoSaldoTotal
import com.monarca.produto.domain.ProdutoUnidade
import com.monarca.produto.domain.SituacaoUnidade
import com.monarca.produto.domain.TipoProduto
import com.monarca.produto.dto.ProdutoBicicletaRequest
import com.monarca.produto.dto.ProdutoBicicletaResponse
import com.monarca.produto.dto.ProdutoEstoqueSaldoResponse
import com.monarca.produto.dto.ProdutoMotoRequest
import com.monarca.produto.dto.ProdutoMotoResponse
import com.monarca.produto.dto.ProdutoRequest
import com.monarca.produto.dto.ProdutoResponse
import com.monarca.produto.dto.ProdutoResumoResponse
import com.monarca.produto.dto.ProdutoUnidadeLoteRequest
import com.monarca.produto.dto.ProdutoUnidadeResponse
import com.monarca.produto.dto.VinculoFilialProdutoConflitoResponse
import com.monarca.produto.repository.MarcaRepository
import com.monarca.produto.repository.ProdutoRepository
import com.monarca.usuario.repository.UsuarioRepository

class VinculoFilialProdutoConflito(
    val idProduto: Long,
    val produto: Produto,
    val filiaisVinculadas: List<FilialVinculo>,
    val idFilialAlvo: Long,
    val filialAlvoNome: String,
    message: String,
) : RuntimeException(message)

class ProdutoService(
    private val repository: ProdutoRepository,
    private val marcaRepository: MarcaRepository,
    private val empresaService: EmpresaService,
    private val usuarioRepository: UsuarioRepository,
) {

    suspend fun listar(idFilial: Long?, tipo: TipoProduto?, idUsuario: Long): List<ProdutoResponse> {
        val idFilialResolvida = resolverFilialComAcesso(idUsuario, idFilial)
        val filial = empresaService.buscarFilial(idFilialResolvida)
        val saldos = repository.somarEstoquePorFilial(idFilialResolvida)
        return repository.listar(idFilialResolvida, filial.listarApenasProdutosFilial, tipo)
            .map { it.toResponse(saldo = saldos[it.produto.id]) }
    }

    suspend fun buscar(id: Long, idFilial: Long? = null, idUsuario: Long? = null): ProdutoResponse {
        val detalhe = repository.buscar(id) ?: throw RecursoNaoEncontrado("Produto $id não encontrado")
        val filial = when {
            idUsuario != null -> resolverFilialComAcesso(idUsuario, idFilial)
            idFilial != null -> idFilial
            else -> detalhe.produto.idFilialCadastro
        }
        val estoques = if (filial != null) repository.listarEstoqueDoProduto(id, filial) else emptyList()
        return detalhe.toResponse(estoques = estoques)
    }

    suspend fun criar(request: ProdutoRequest, idUsuario: Long): ProdutoResponse {
        val idFilial = resolverFilialComAcesso(idUsuario, request.idFilialCadastro)
        val filialAlvo = empresaService.buscarFilial(idFilial)
        if (request.quantidadeInicial < 0) {
            throw invalido("VALOR_NEGATIVO", "Quantidade inicial não pode ser negativa")
        }
        val produto = validarProduto(request, id = 0, moedaPreco = filialAlvo.moedaOperacao)
        val moto = if (produto.tipo == TipoProduto.MOTO) validarMoto(request.moto, 0, 0) else null
        val bicicleta = if (produto.tipo == TipoProduto.BICICLETA) validarBicicleta(request.bicicleta, 0, 0) else null
        val numeros = if (produto.controlaChassi) parsearNumeros(request.numerosIniciais) else emptyList()
        if (!produto.controlaChassi && request.numerosIniciais.any { it.isNotBlank() }) {
            throw invalido("CHASSI_NAO_CONTROLADO", "Este produto não controla chassis")
        }
        if (numeros.size != numeros.distinct().size) {
            throw invalido(
                "CHASSI_DUPLICADO",
                "Há chassis repetidos na lista",
                "chassi" to numeros.groupingBy { it }.eachCount().filterValues { it > 1 }.keys.first(),
            )
        }
        for (numero in numeros) exigirNumeroLivre(numero)

        val existente = if (produto.codigo.isEmpty()) null else repository.buscarPorCodigo(produto.codigo)
        val qtdInicial = if (produto.controlaChassi) numeros.size else request.quantidadeInicial
        val id = when {
            existente == null -> inserirComCodigoUnico(produto, moto, bicicleta, idFilial, qtdInicial, numeros)
            existente.produto.status == Status.DELETADO -> {
                atualizarComCodigoUnico(existente.produto.id, produto.copy(id = existente.produto.id), moto, bicicleta)
                vincular(existente, idFilial, request, filialAlvo.nome)
                existente.produto.id
            }
            else -> {
                vincular(existente, idFilial, request, filialAlvo.nome)
                existente.produto.id
            }
        }
        return buscar(id, idFilial, idUsuario)
    }

    suspend fun atualizar(id: Long, request: ProdutoRequest): ProdutoResponse {
        val atual = repository.buscar(id) ?: throw RecursoNaoEncontrado("Produto $id não encontrado")
        if (request.tipo != atual.produto.tipo) {
            throw invalido("PRODUTO_TIPO_IMUTAVEL", "Não é possível alterar o tipo do produto")
        }
        if (request.controlaChassi != null && request.controlaChassi != atual.produto.controlaChassi) {
            throw invalido("CONTROLA_CHASSI_IMUTAVEL", "Não é possível alterar o controle de chassis")
        }
        val idFilialMoeda = request.idFilialCadastro ?: atual.produto.idFilialCadastro
            ?: throw RecursoNaoEncontrado("Filial do produto não encontrada")
        val moedaOperacao = empresaService.buscarFilial(idFilialMoeda).moedaOperacao
        val produto = validarProduto(
            request,
            id,
            moedaPreco = moedaOperacao,
            controlaChassiFixo = atual.produto.controlaChassi,
        )
        if (repository.existeCodigo(produto.codigo, ignorarId = id)) {
            throw codigoDuplicado(produto.codigo)
        }
        val moto = if (produto.tipo == TipoProduto.MOTO) validarMoto(request.moto, 0, id) else null
        val bicicleta = if (produto.tipo == TipoProduto.BICICLETA) validarBicicleta(request.bicicleta, 0, id) else null
        bicicleta?.numeroSerieQuadro?.let { exigirSerieLivre(it, id) }
        atualizarComCodigoUnico(id, produto, moto, bicicleta)
        return buscar(id)
    }

    suspend fun atualizarStatus(id: Long, status: Status): ProdutoResponse {
        repository.buscar(id) ?: throw RecursoNaoEncontrado("Produto $id não encontrado")
        if (!repository.atualizarStatus(id, validarStatus(status))) {
            throw RecursoNaoEncontrado("Produto $id não encontrado")
        }
        return buscar(id)
    }

    suspend fun excluir(id: Long, idFilial: Long?, idUsuario: Long) {
        repository.buscar(id) ?: throw RecursoNaoEncontrado("Produto $id não encontrado")
        exigirAcessoFilial(idUsuario, idFilial)
        if (idFilial == null && repository.produtoEmUso(id)) {
            throw invalido("PRODUTO_EM_ESTOQUE", "Não é possível excluir um produto lançado em estoque")
        }
        if (!repository.excluir(id, idFilial)) {
            throw RecursoNaoEncontrado("Produto $id não encontrado")
        }
    }

    suspend fun listarUnidades(
        idProduto: Long,
        idFilial: Long?,
        situacao: SituacaoUnidade?,
        idUsuario: Long,
    ): List<ProdutoUnidadeResponse> {
        repository.buscar(idProduto) ?: throw RecursoNaoEncontrado("Produto $idProduto não encontrado")
        val filial = resolverFilialComAcesso(idUsuario, idFilial)
        return repository.listarUnidades(idProduto, filial, situacao).map { it.toResponse() }
    }

    suspend fun adicionarUnidades(
        idProduto: Long,
        request: ProdutoUnidadeLoteRequest,
        idUsuario: Long,
    ): List<ProdutoUnidadeResponse> {
        val detalhe = repository.buscar(idProduto) ?: throw RecursoNaoEncontrado("Produto $idProduto não encontrado")
        if (!detalhe.produto.controlaChassi) {
            throw invalido("CHASSI_NAO_CONTROLADO", "Este produto não controla chassis")
        }
        val idFilial = resolverFilialComAcesso(idUsuario, detalhe.produto.idFilialCadastro)
        val numeros = parsearNumeros(request.numeros)
        if (numeros.isEmpty()) {
            throw invalido("CHASSI_OBRIGATORIO", "Informe ao menos um chassi")
        }
        if (numeros.size != numeros.distinct().size) {
            throw invalido("CHASSI_DUPLICADO", "Há chassis repetidos na lista", "chassi" to numeros.groupingBy { it }.eachCount().filterValues { it > 1 }.keys.first())
        }
        for (numero in numeros) exigirNumeroLivre(numero)
        val saldos = repository.listarEstoqueDoProduto(idProduto, idFilial)
        val padrao = saldos.find { it.padrao }
            ?: throw invalido("ESTOQUE_INSUFICIENTE", "Sem estoque padrão na filial")
        val idEstoque = request.idEstoque ?: padrao.idEstoque
        if (saldos.none { it.idEstoque == idEstoque }) {
            throw RecursoNaoEncontrado("Estoque $idEstoque não encontrado")
        }
        repository.inserirUnidades(idProduto, idEstoque, numeros)
        return repository.listarUnidades(idProduto, idFilial, null).map { it.toResponse() }
    }

    suspend fun excluirUnidade(idProduto: Long, idUnidade: Long, idUsuario: Long) {
        val detalhe = repository.buscar(idProduto) ?: throw RecursoNaoEncontrado("Produto $idProduto não encontrado")
        resolverFilialComAcesso(idUsuario, detalhe.produto.idFilialCadastro)
        val unidade = repository.buscarUnidadesPorIds(listOf(idUnidade)).firstOrNull()
            ?: throw RecursoNaoEncontrado("Chassi $idUnidade não encontrado")
        if (unidade.idProduto != idProduto) {
            throw RecursoNaoEncontrado("Chassi $idUnidade não encontrado")
        }
        if (unidade.situacao == SituacaoUnidade.VENDIDO) {
            throw invalido("UNIDADE_VENDIDA", "Não é possível excluir um chassi já vendido")
        }
        if (!repository.excluirUnidade(idUnidade)) {
            throw RecursoNaoEncontrado("Chassi $idUnidade não encontrado")
        }
    }

    fun toVinculoResponse(e: VinculoFilialProdutoConflito) = VinculoFilialProdutoConflitoResponse(
        codigo = "VINCULO_FILIAL",
        message = e.message ?: "Confirme o vínculo com a filial",
        idProduto = e.idProduto,
        produto = ProdutoResumoResponse(
            id = e.produto.id,
            codigo = e.produto.codigo,
            nome = e.produto.nome,
            tipo = e.produto.tipo,
        ),
        filiaisVinculadas = e.filiaisVinculadas.map { it.toResponse() },
        idFilialAlvo = e.idFilialAlvo,
        filialAlvoNome = e.filialAlvoNome,
    )

    private suspend fun vincular(
        existente: ProdutoCompleto,
        idFilial: Long,
        request: ProdutoRequest,
        filialAlvoNome: String,
    ) {
        if (repository.existeVinculoFilial(existente.produto.id, idFilial)) {
            throw invalido("PRODUTO_CODIGO_DUPLICADO", "Já existe um produto com o código ${existente.produto.codigo} nesta filial", "codigo" to existente.produto.codigo)
        }
        val filiaisOutras = existente.filiaisVinculadas.filter { it.id != idFilial }
        if (filiaisOutras.isNotEmpty() && !request.confirmarVinculoFilial) {
            throw VinculoFilialProdutoConflito(
                idProduto = existente.produto.id,
                produto = existente.produto,
                filiaisVinculadas = existente.filiaisVinculadas,
                idFilialAlvo = idFilial,
                filialAlvoNome = filialAlvoNome,
                message = "Cadastro existente em outra filial. Confirme o vínculo.",
            )
        }
        repository.vincularFilial(existente.produto.id, idFilial)
    }

    private suspend fun validarProduto(
        request: ProdutoRequest,
        id: Long,
        moedaPreco: Moeda,
        controlaChassiFixo: Boolean? = null,
    ): Produto {
        val codigo = request.codigo.trim().uppercase()
        if (codigo.isEmpty()) {
            if (id != 0L) throw invalido("PRODUTO_CODIGO_OBRIGATORIO", "Código do produto é obrigatório")
        } else if (codigo.length > 40) {
            throw invalido("PRODUTO_CODIGO_TAMANHO", "O código do produto deve ter no máximo 40 caracteres")
        }
        val modelo = marcaRepository.buscarModelo(request.idModelo)
            ?: throw RecursoNaoEncontrado("Modelo ${request.idModelo} não encontrado")
        if (modelo.modelo.idMarca != request.idMarca) {
            throw invalido("MODELO_MARCA_DIVERGENTE", "O modelo não pertence à marca selecionada")
        }
        if (modelo.modelo.tipo != request.tipo) {
            throw invalido("MODELO_TIPO_DIVERGENTE", "O modelo não é do tipo ${request.tipo.name.lowercase()}", "tipo" to request.tipo.name.lowercase())
        }
        val marca = marcaRepository.buscar(request.idMarca)
            ?: throw RecursoNaoEncontrado("Marca ${request.idMarca} não encontrada")
        val composto = "${marca.nome} ${modelo.modelo.nome}"
        val informado = request.nome?.trim().orEmpty()
        val nome = when {
            informado.isNotEmpty() -> {
                if (informado.length > 180) {
                    throw invalido("PRODUTO_NOME_TAMANHO", "O nome do produto deve ter no máximo 180 caracteres")
                }
                Texto.titleCase(informado)
            }
            request.nome != null -> throw invalido("PRODUTO_NOME_OBRIGATORIO", "O nome do produto é obrigatório")
            else -> composto
        }
        val status = validarStatus(request.status)
        val controlaChassi = controlaChassiFixo
            ?: request.controlaChassi
            ?: (request.tipo == TipoProduto.MOTO)
        return Produto(
            id = id,
            codigo = codigo,
            nome = nome,
            idMarca = marca.id,
            idModelo = modelo.modelo.id,
            marcaNome = marca.nome,
            modeloNome = modelo.modelo.nome,
            descricao = request.descricao?.trim()?.takeIf { it.isNotEmpty() },
            tipo = request.tipo,
            controlaChassi = controlaChassi,
            idFilialCadastro = request.idFilialCadastro,
            aliquotaIva = validarAliquota(request.aliquotaIva),
            moedaPreco = moedaPreco,
            precoLista = validarDinheiro(request.precoLista, "Preço de lista"),
            custo = validarDinheiro(request.custo, "Custo"),
            status = status,
        )
    }

    private fun validarMoto(request: ProdutoMotoRequest?, id: Long, idProduto: Long): ProdutoMoto {
        val req = request ?: throw invalido("MOTO_DADOS_OBRIGATORIOS", "Dados da moto são obrigatórios")
        val anoFabricacao = validarAno(req.anoFabricacao, "Ano de fabricação")
        val anoModelo = validarAno(req.anoModelo, "Ano modelo")
        if (anoModelo < anoFabricacao) {
            throw invalido("ANO_MODELO_ANTERIOR", "Ano modelo não pode ser anterior ao ano de fabricação")
        }
        return ProdutoMoto(
            id = id,
            idProduto = idProduto,
            cor = textoOpcional(req.cor),
            potenciaMotorW = inteiroOpcional(req.potenciaMotorW, "Potência"),
            autonomiaKm = inteiroOpcional(req.autonomiaKm, "Autonomia"),
            velocidadeMaxKmh = inteiroOpcional(req.velocidadeMaxKmh, "Velocidade máxima"),
            capacidadeBateriaAh = decimalOpcional(req.capacidadeBateriaAh, "Bateria"),
            voltagemBateria = inteiroOpcional(req.voltagemBateria, "Voltagem"),
            tempoCargaHoras = decimalOpcional(req.tempoCargaHoras, "Tempo de carga"),
            pesoKg = decimalOpcional(req.pesoKg, "Peso"),
            capacidadeCargaKg = inteiroOpcional(req.capacidadeCargaKg, "Capacidade de carga"),
            assentos = inteiroOpcional(req.assentos, "Assentos"),
            tipoFreio = textoOpcional(req.tipoFreio),
            anoFabricacao = anoFabricacao,
            anoModelo = anoModelo,
        )
    }

    private fun validarBicicleta(request: ProdutoBicicletaRequest?, id: Long, idProduto: Long): ProdutoBicicleta {
        val req = request ?: ProdutoBicicletaRequest()
        return ProdutoBicicleta(
            id = id,
            idProduto = idProduto,
            cor = textoOpcional(req.cor),
            potenciaMotorW = inteiroOpcional(req.potenciaMotorW, "Potência"),
            autonomiaKm = inteiroOpcional(req.autonomiaKm, "Autonomia"),
            capacidadeBateriaAh = decimalOpcional(req.capacidadeBateriaAh, "Bateria"),
            voltagemBateria = inteiroOpcional(req.voltagemBateria, "Voltagem"),
            tempoCargaHoras = decimalOpcional(req.tempoCargaHoras, "Tempo de carga"),
            pesoKg = decimalOpcional(req.pesoKg, "Peso"),
            aro = textoOpcional(req.aro),
            tipoQuadro = textoOpcional(req.tipoQuadro),
            numeroMarchas = inteiroOpcional(req.numeroMarchas, "Marchas"),
            tipoFreio = textoOpcional(req.tipoFreio),
            numeroSerieQuadro = req.numeroSerieQuadro?.trim()?.uppercase()?.takeIf { it.isNotEmpty() },
        )
    }

    private fun validarAno(ano: Int, rotulo: String): Int {
        val atual = java.time.Year.now().value
        if (ano < 1990 || ano > atual + 1) {
            throw invalido("ANO_FORA_FAIXA", "$rotulo deve estar entre 1990 e ${atual + 1}", "min" to 1990, "max" to atual + 1)
        }
        return ano
    }

    private fun parsearNumeros(itens: List<String>): List<String> = try {
        ChassiNumeros.expandirTexto(itens.joinToString("\n")).also { lista ->
            if (lista.size > ChassiNumeros.MAXIMO) {
                throw ChassiIntervaloGrande(ChassiNumeros.MAXIMO)
            }
        }
    } catch (e: ChassiIntervaloInvalido) {
        throw invalido("CHASSI_INTERVALO_INVALIDO", "Intervalo de chassi inválido")
    } catch (e: ChassiIntervaloGrande) {
        throw invalido("CHASSI_INTERVALO_GRANDE", "O intervalo não pode passar de ${e.maximo} chassis", "max" to e.maximo)
    }

    private suspend fun exigirNumeroLivre(numero: String) {
        if (repository.existeNumeroUnidade(numero)) {
            throw invalido("CHASSI_DUPLICADO", "Já existe uma moto com o chassi $numero", "chassi" to numero)
        }
    }

    private suspend fun exigirSerieLivre(serie: String, ignorarIdProduto: Long?) {
        if (repository.existeNumeroSerieQuadro(serie, ignorarIdProduto)) {
            throw invalido("SERIE_QUADRO_DUPLICADA", "Já existe uma bicicleta com o número de série $serie", "serie" to serie)
        }
    }

    private fun textoOpcional(valor: String?): String? =
        valor?.trim()?.takeIf { it.isNotEmpty() }?.let(Texto::titleCase)

    private fun inteiroOpcional(valor: Int?, rotulo: String): Int? {
        if (valor != null && valor < 0) throw invalido("VALOR_NEGATIVO", "$rotulo não pode ser negativo")
        return valor
    }

    private fun decimalOpcional(valor: Double?, rotulo: String): Double? {
        if (valor != null && valor < 0) throw invalido("VALOR_NEGATIVO", "$rotulo não pode ser negativo")
        return valor
    }

    private fun validarAliquota(valor: Int): Int {
        if (valor != 0 && valor != 5 && valor != 10) {
            throw invalido("IVA_ALIQUOTA_INVALIDA", "A alíquota de IVA deve ser 0, 5 ou 10")
        }
        return valor
    }

    private fun validarDinheiro(valor: Double, rotulo: String): Double {
        if (valor < 0) throw invalido("VALOR_NEGATIVO", "$rotulo não pode ser negativo")
        return valor
    }

    private fun validarStatus(status: Status): Status {
        if (status == Status.DELETADO) throw invalido("USE_DELETE", "Use DELETE para marcar como deletado")
        return status
    }

    private suspend fun inserirComCodigoUnico(
        produto: Produto,
        moto: ProdutoMoto?,
        bicicleta: ProdutoBicicleta?,
        idFilial: Long,
        quantidadeInicial: Int,
        numerosIniciais: List<String> = emptyList(),
    ): Long = try {
        repository.inserir(produto, moto, bicicleta, idFilial, quantidadeInicial, numerosIniciais)
    } catch (e: Exception) {
        if (e.isViolacaoUnicaCodigo()) throw codigoDuplicado(produto.codigo) else throw e
    }

    private suspend fun atualizarComCodigoUnico(
        id: Long,
        produto: Produto,
        moto: ProdutoMoto?,
        bicicleta: ProdutoBicicleta?,
    ) {
        try {
            repository.atualizar(id, produto, moto, bicicleta)
        } catch (e: Exception) {
            if (e.isViolacaoUnicaCodigo()) throw codigoDuplicado(produto.codigo) else throw e
        }
    }

    private fun codigoDuplicado(codigo: String) =
        invalido("PRODUTO_CODIGO_DUPLICADO", "Já existe um produto com o código $codigo", "codigo" to codigo)

    private fun Throwable.isViolacaoUnicaCodigo(): Boolean {
        var atual: Throwable? = this
        while (atual != null) {
            if (atual.message.orEmpty().contains("produto_codigo", ignoreCase = true)) return true
            atual = atual.cause
        }
        return false
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

    private fun ProdutoCompleto.toResponse(
        saldo: ProdutoSaldoTotal? = null,
        estoques: List<ProdutoEstoqueSaldo> = emptyList(),
    ): ProdutoResponse {
        val quantidade = saldo?.quantidade ?: estoques.sumOf { it.quantidade }
        val reservada = saldo?.quantidadeReservada ?: estoques.sumOf { it.quantidadeReservada }
        return ProdutoResponse(
            id = produto.id,
            codigo = produto.codigo,
            nome = produto.nome,
            idMarca = produto.idMarca,
            marca = produto.marcaNome,
            idModelo = produto.idModelo,
            modelo = produto.modeloNome,
            descricao = produto.descricao,
            tipo = produto.tipo,
            controlaChassi = produto.controlaChassi,
            idFilialCadastro = produto.idFilialCadastro,
            filialNome = filialNome,
            filiaisVinculadas = filiaisVinculadas.map { it.toResponse() },
            aliquotaIva = produto.aliquotaIva,
            moedaPreco = produto.moedaPreco,
            precoLista = produto.precoLista,
            custo = produto.custo,
            status = produto.status,
            moto = moto?.toResponse(),
            bicicleta = bicicleta?.toResponse(),
            quantidade = quantidade,
            quantidadeReservada = reservada,
            quantidadeDisponivel = quantidade - reservada,
            estoques = estoques.map { it.toResponse() },
        )
    }

    private fun ProdutoEstoqueSaldo.toResponse() = ProdutoEstoqueSaldoResponse(
        idEstoque = idEstoque,
        estoqueNome = estoqueNome,
        quantidade = quantidade,
        quantidadeReservada = quantidadeReservada,
        quantidadeDisponivel = quantidadeDisponivel,
        padrao = padrao,
    )

    private fun ProdutoMoto.toResponse() = ProdutoMotoResponse(
        cor = cor,
        potenciaMotorW = potenciaMotorW,
        autonomiaKm = autonomiaKm,
        velocidadeMaxKmh = velocidadeMaxKmh,
        capacidadeBateriaAh = capacidadeBateriaAh,
        voltagemBateria = voltagemBateria,
        tempoCargaHoras = tempoCargaHoras,
        pesoKg = pesoKg,
        capacidadeCargaKg = capacidadeCargaKg,
        assentos = assentos,
        tipoFreio = tipoFreio,
        anoFabricacao = anoFabricacao,
        anoModelo = anoModelo,
    )

    private fun ProdutoBicicleta.toResponse() = ProdutoBicicletaResponse(
        cor = cor,
        potenciaMotorW = potenciaMotorW,
        autonomiaKm = autonomiaKm,
        capacidadeBateriaAh = capacidadeBateriaAh,
        voltagemBateria = voltagemBateria,
        tempoCargaHoras = tempoCargaHoras,
        pesoKg = pesoKg,
        aro = aro,
        tipoQuadro = tipoQuadro,
        numeroMarchas = numeroMarchas,
        tipoFreio = tipoFreio,
        numeroSerieQuadro = numeroSerieQuadro,
    )

    private fun ProdutoUnidade.toResponse() = ProdutoUnidadeResponse(
        id = id,
        idProduto = idProduto,
        idEstoque = idEstoque,
        estoqueNome = estoqueNome,
        numero = numero,
        situacao = situacao,
        idVendaItem = idVendaItem,
    )

    private fun FilialVinculo.toResponse() = FilialVinculoResponse(id = id, nome = nome)
}
