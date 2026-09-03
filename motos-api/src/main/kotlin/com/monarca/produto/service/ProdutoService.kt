package com.monarca.produto.service

import com.monarca.Texto
import com.monarca.common.enums.Status
import com.monarca.empresa.service.EmpresaService
import com.monarca.localidade.service.RecursoNaoEncontrado
import com.monarca.localidade.service.acesso
import com.monarca.localidade.service.invalido
import com.monarca.pessoa.domain.FilialVinculo
import com.monarca.pessoa.dto.FilialVinculoResponse
import com.monarca.produto.domain.Produto
import com.monarca.produto.domain.ProdutoBicicleta
import com.monarca.produto.domain.ProdutoCompleto
import com.monarca.produto.domain.ProdutoEstoqueSaldo
import com.monarca.produto.domain.ProdutoMoto
import com.monarca.produto.domain.ProdutoSaldoTotal
import com.monarca.produto.domain.TipoProduto
import com.monarca.produto.dto.ProdutoBicicletaRequest
import com.monarca.produto.dto.ProdutoBicicletaResponse
import com.monarca.produto.dto.ProdutoEstoqueSaldoResponse
import com.monarca.produto.dto.ProdutoMotoRequest
import com.monarca.produto.dto.ProdutoMotoResponse
import com.monarca.produto.dto.ProdutoRequest
import com.monarca.produto.dto.ProdutoResponse
import com.monarca.produto.dto.ProdutoResumoResponse
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
        val produto = validarProduto(request, id = 0)
        val moto = if (produto.tipo == TipoProduto.MOTO) validarMoto(request.moto, 0, 0) else null
        val bicicleta = if (produto.tipo == TipoProduto.BICICLETA) validarBicicleta(request.bicicleta, 0, 0) else null
        moto?.chassi?.let { exigirChassiLivre(it, null) }
        bicicleta?.numeroSerieQuadro?.let { exigirSerieLivre(it, null) }

        val existente = repository.buscarPorCodigo(produto.codigo)
        val id = when {
            existente == null -> repository.inserir(produto, moto, bicicleta, idFilial)
            existente.produto.status == Status.DELETADO -> {
                repository.atualizar(existente.produto.id, produto.copy(id = existente.produto.id), moto, bicicleta)
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
        val produto = validarProduto(request, id)
        if (repository.existeCodigo(produto.codigo, ignorarId = id)) {
            throw invalido("PRODUTO_CODIGO_DUPLICADO", "Já existe um produto com o código ${produto.codigo}", "codigo" to produto.codigo)
        }
        val moto = if (produto.tipo == TipoProduto.MOTO) validarMoto(request.moto, 0, id) else null
        val bicicleta = if (produto.tipo == TipoProduto.BICICLETA) validarBicicleta(request.bicicleta, 0, id) else null
        moto?.chassi?.let { exigirChassiLivre(it, id) }
        bicicleta?.numeroSerieQuadro?.let { exigirSerieLivre(it, id) }
        repository.atualizar(id, produto, moto, bicicleta)
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

    private suspend fun validarProduto(request: ProdutoRequest, id: Long): Produto {
        val codigo = request.codigo.trim().uppercase()
        if (codigo.length < 2) throw invalido("PRODUTO_CODIGO_OBRIGATORIO", "Código do produto é obrigatório")
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
        val nome = "${marca.nome} ${modelo.modelo.nome}"
        val status = validarStatus(request.status)
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
            idFilialCadastro = request.idFilialCadastro,
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
            chassi = req.chassi?.trim()?.uppercase()?.takeIf { it.isNotEmpty() },
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

    private suspend fun exigirChassiLivre(chassi: String, ignorarIdProduto: Long?) {
        if (repository.existeChassi(chassi, ignorarIdProduto)) {
            throw invalido("CHASSI_DUPLICADO", "Já existe uma moto com o chassi $chassi", "chassi" to chassi)
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
            idFilialCadastro = produto.idFilialCadastro,
            filialNome = filialNome,
            filiaisVinculadas = filiaisVinculadas.map { it.toResponse() },
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
    )

    private fun ProdutoMoto.toResponse() = ProdutoMotoResponse(
        chassi = chassi,
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

    private fun FilialVinculo.toResponse() = FilialVinculoResponse(id = id, nome = nome)
}
