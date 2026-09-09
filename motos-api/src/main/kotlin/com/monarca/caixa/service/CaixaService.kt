package com.monarca.caixa.service

import com.monarca.Texto
import com.monarca.caixa.domain.Caixa
import com.monarca.caixa.domain.CaixaSessao
import com.monarca.caixa.domain.Finalizador
import com.monarca.caixa.domain.StatusSessaoCaixa
import com.monarca.caixa.domain.ValorFinalizador
import com.monarca.caixa.dto.AbrirSessaoRequest
import com.monarca.caixa.dto.CaixaAcessoResponse
import com.monarca.caixa.dto.CaixaMovimentacaoResponse
import com.monarca.caixa.dto.CaixaRequest
import com.monarca.caixa.dto.CaixaResponse
import com.monarca.caixa.dto.CaixaSessaoResponse
import com.monarca.caixa.dto.FecharSessaoRequest
import com.monarca.caixa.dto.FinalizadorRequest
import com.monarca.caixa.dto.FinalizadorResponse
import com.monarca.caixa.dto.TransferenciaCaixaRequest
import com.monarca.caixa.dto.ValorFinalizadorRequest
import com.monarca.caixa.dto.ValorFinalizadorResponse
import com.monarca.caixa.repository.CaixaRepository
import com.monarca.caixa.repository.MovimentacaoDetalhe
import com.monarca.caixa.repository.SessaoDetalhe
import com.monarca.common.enums.Status
import com.monarca.empresa.service.EmpresaService
import com.monarca.localidade.service.RecursoNaoEncontrado
import com.monarca.localidade.service.acesso
import com.monarca.localidade.service.invalido
import com.monarca.produto.domain.Moeda
import com.monarca.usuario.repository.UsuarioRepository
import java.time.LocalDate
import java.time.ZoneId

class CaixaService(
    private val repository: CaixaRepository,
    private val empresaService: EmpresaService,
    private val usuarioRepository: UsuarioRepository,
    private val zona: ZoneId,
) {

    suspend fun listarFinalizadores(): List<FinalizadorResponse> =
        repository.listarFinalizadores().map { it.toResponse() }

    suspend fun buscarFinalizador(id: Long): FinalizadorResponse =
        repository.buscarFinalizador(id)?.toResponse()
            ?: throw RecursoNaoEncontrado("Finalizador $id não encontrado")

    suspend fun criarFinalizador(request: FinalizadorRequest): FinalizadorResponse {
        val item = validarFinalizador(request, 0)
        if (repository.existeFinalizadorNome(item.nome)) {
            throw invalido("FINALIZADOR_NOME_DUPLICADO", "Já existe um finalizador com o nome ${item.nome}", "nome" to item.nome)
        }
        val id = repository.inserirFinalizador(item)
        return buscarFinalizador(id)
    }

    suspend fun atualizarFinalizador(id: Long, request: FinalizadorRequest): FinalizadorResponse {
        repository.buscarFinalizador(id) ?: throw RecursoNaoEncontrado("Finalizador $id não encontrado")
        val item = validarFinalizador(request, id)
        if (repository.existeFinalizadorNome(item.nome, ignorarId = id)) {
            throw invalido("FINALIZADOR_NOME_DUPLICADO", "Já existe um finalizador com o nome ${item.nome}", "nome" to item.nome)
        }
        repository.atualizarFinalizador(id, item)
        return buscarFinalizador(id)
    }

    suspend fun excluirFinalizador(id: Long) {
        repository.buscarFinalizador(id) ?: throw RecursoNaoEncontrado("Finalizador $id não encontrado")
        if (repository.finalizadorEmUso(id)) {
            throw invalido("FINALIZADOR_EM_USO", "Não é possível excluir um finalizador em uso")
        }
        if (!repository.excluirFinalizador(id)) {
            throw RecursoNaoEncontrado("Finalizador $id não encontrado")
        }
    }

    suspend fun listarCaixas(idFilial: Long?, idUsuario: Long, somenteComAcesso: Boolean): List<CaixaResponse> {
        val filial = resolverFilialComAcesso(idUsuario, idFilial)
        val acessos = repository.listarAcessos(idUsuario).associateBy { it.id }
        return repository.listarCaixas(filial)
            .filter { !somenteComAcesso || acessos.containsKey(it.caixa.id) }
            .map { detalhe ->
                val aberta = repository.buscarSessaoAberta(detalhe.caixa.id)
                CaixaResponse(
                    id = detalhe.caixa.id,
                    idFilial = detalhe.caixa.idFilial,
                    filialNome = detalhe.filialNome,
                    nome = detalhe.caixa.nome,
                    status = detalhe.caixa.status,
                    sessaoAbertaId = aberta?.id,
                    padrao = acessos[detalhe.caixa.id]?.padrao == true,
                )
            }
    }

    suspend fun buscarCaixa(id: Long, idUsuario: Long): CaixaResponse {
        val detalhe = repository.buscarCaixa(id) ?: throw RecursoNaoEncontrado("Caixa $id não encontrado")
        exigirAcessoFilial(idUsuario, detalhe.caixa.idFilial)
        val aberta = repository.buscarSessaoAberta(id)
        val acesso = repository.listarAcessos(idUsuario).find { it.id == id }
        return CaixaResponse(
            id = detalhe.caixa.id,
            idFilial = detalhe.caixa.idFilial,
            filialNome = detalhe.filialNome,
            nome = detalhe.caixa.nome,
            status = detalhe.caixa.status,
            sessaoAbertaId = aberta?.id,
            padrao = acesso?.padrao == true,
        )
    }

    suspend fun criarCaixa(request: CaixaRequest, idUsuario: Long): CaixaResponse {
        val idFilial = resolverFilialComAcesso(idUsuario, request.idFilial)
        val caixa = validarCaixa(request, 0, idFilial)
        if (repository.existeCaixaNome(idFilial, caixa.nome)) {
            throw invalido("CAIXA_NOME_DUPLICADO", "Já existe um caixa com o nome ${caixa.nome} nesta filial", "nome" to caixa.nome)
        }
        val id = repository.inserirCaixa(caixa)
        repository.vincularUsuariosDaFilial(id, idFilial)
        return buscarCaixa(id, idUsuario)
    }

    suspend fun atualizarCaixa(id: Long, request: CaixaRequest, idUsuario: Long): CaixaResponse {
        val atual = repository.buscarCaixa(id) ?: throw RecursoNaoEncontrado("Caixa $id não encontrado")
        exigirAcessoFilial(idUsuario, atual.caixa.idFilial)
        val idFilial = resolverFilialComAcesso(idUsuario, request.idFilial ?: atual.caixa.idFilial)
        val caixa = validarCaixa(request, id, idFilial)
        if (repository.existeCaixaNome(idFilial, caixa.nome, ignorarId = id)) {
            throw invalido("CAIXA_NOME_DUPLICADO", "Já existe um caixa com o nome ${caixa.nome} nesta filial", "nome" to caixa.nome)
        }
        repository.atualizarCaixa(id, caixa)
        return buscarCaixa(id, idUsuario)
    }

    suspend fun excluirCaixa(id: Long, idUsuario: Long) {
        val atual = repository.buscarCaixa(id) ?: throw RecursoNaoEncontrado("Caixa $id não encontrado")
        exigirAcessoFilial(idUsuario, atual.caixa.idFilial)
        if (repository.buscarSessaoAberta(id) != null) {
            throw invalido("CAIXA_SESSAO_ABERTA", "Feche a sessão antes de excluir o caixa")
        }
        if (repository.caixaTemSessao(id)) {
            throw invalido("CAIXA_COM_SESSOES", "Não é possível excluir um caixa que já teve movimento")
        }
        if (!repository.excluirCaixa(id)) {
            throw RecursoNaoEncontrado("Caixa $id não encontrado")
        }
    }

    suspend fun listarMeusCaixas(idUsuario: Long, idFilial: Long?): List<CaixaAcessoResponse> {
        val filial = idFilial?.let { resolverFilialComAcesso(idUsuario, it) }
        return repository.listarAcessos(idUsuario)
            .filter { filial == null || it.idFilial == filial }
            .map {
                CaixaAcessoResponse(
                    id = it.id,
                    nome = it.nome,
                    idFilial = it.idFilial,
                    filialNome = it.filialNome,
                    padrao = it.padrao,
                )
            }
    }

    suspend fun substituirAcessosUsuario(idUsuario: Long, idsCaixas: List<Long>?, idCaixaPadrao: Long?) {
        if (idsCaixas == null) {
            val filiais = usuarioRepository.listarFiliais(idUsuario).map { it.id }
            val ids = filiais.flatMap { filial -> repository.listarCaixas(filial).map { it.caixa.id } }
            val padrao = ids.firstOrNull()
            if (ids.isNotEmpty()) repository.substituirAcessos(idUsuario, ids, padrao)
            return
        }
        if (idsCaixas.isEmpty()) {
            throw invalido("CAIXAS_OBRIGATORIOS", "Selecione ao menos um caixa")
        }
        val padrao = idCaixaPadrao ?: idsCaixas.first()
        if (padrao !in idsCaixas) {
            throw invalido("CAIXA_PADRAO_INVALIDO", "O caixa padrão precisa estar entre os selecionados")
        }
        for (idCaixa in idsCaixas) {
            repository.buscarCaixa(idCaixa) ?: throw RecursoNaoEncontrado("Caixa $idCaixa não encontrado")
        }
        repository.substituirAcessos(idUsuario, idsCaixas.distinct(), padrao)
    }

    suspend fun abrirSessao(request: AbrirSessaoRequest, idUsuario: Long): CaixaSessaoResponse {
        val caixa = repository.buscarCaixa(request.idCaixa) ?: throw RecursoNaoEncontrado("Caixa ${request.idCaixa} não encontrado")
        exigirAcessoFilial(idUsuario, caixa.caixa.idFilial)
        exigirAcessoCaixa(idUsuario, request.idCaixa)
        if (caixa.caixa.status != Status.ATIVO) {
            throw invalido("CAIXA_INATIVO", "O caixa não está ativo")
        }
        if (repository.buscarSessaoAberta(request.idCaixa) != null) {
            throw invalido("CAIXA_SESSAO_ABERTA", "Este caixa já possui sessão aberta")
        }
        val conferencia = validarValores(request.conferencia)
        val agora = System.currentTimeMillis()
        val id = repository.abrirSessao(
            CaixaSessao(
                id = 0,
                idCaixa = request.idCaixa,
                idUsuarioAbertura = idUsuario,
                idUsuarioFechamento = null,
                data = LocalDate.now(zona).toString(),
                abertoEm = agora,
                fechadoEm = null,
                observacaoAbertura = request.observacao?.trim()?.ifBlank { null },
                observacaoFechamento = null,
                status = StatusSessaoCaixa.ABERTO,
            ),
            conferencia,
            idUsuario,
        )
        return buscarSessao(id, idUsuario)
    }

    suspend fun fecharSessao(id: Long, request: FecharSessaoRequest, idUsuario: Long): CaixaSessaoResponse {
        val detalhe = repository.buscarSessao(id) ?: throw RecursoNaoEncontrado("Sessão $id não encontrada")
        exigirAcessoFilial(idUsuario, detalhe.idFilial)
        exigirAcessoCaixa(idUsuario, detalhe.sessao.idCaixa)
        if (detalhe.sessao.status != StatusSessaoCaixa.ABERTO) {
            throw invalido("CAIXA_SESSAO_FECHADA", "A sessão já está fechada")
        }
        val conferencia = validarValores(request.conferencia)
        if (conferencia.isEmpty()) {
            throw invalido("CAIXA_CONFERENCIA_OBRIGATORIA", "Informe a conferência de fechamento")
        }
        repository.fecharSessao(
            id,
            detalhe.sessao.copy(
                idUsuarioFechamento = idUsuario,
                fechadoEm = System.currentTimeMillis(),
                observacaoFechamento = request.observacao?.trim()?.ifBlank { null },
                status = StatusSessaoCaixa.FECHADO,
            ),
            conferencia,
            idUsuario,
        )
        return buscarSessao(id, idUsuario)
    }

    suspend fun transferir(idSessaoOrigem: Long, request: TransferenciaCaixaRequest, idUsuario: Long) {
        val origem = repository.buscarSessao(idSessaoOrigem) ?: throw RecursoNaoEncontrado("Sessão $idSessaoOrigem não encontrada")
        exigirAcessoFilial(idUsuario, origem.idFilial)
        exigirAcessoCaixa(idUsuario, origem.sessao.idCaixa)
        if (origem.sessao.status != StatusSessaoCaixa.ABERTO) {
            throw invalido("CAIXA_SESSAO_FECHADA", "A sessão de origem está fechada")
        }
        if (request.idCaixaDestino == origem.sessao.idCaixa) {
            throw invalido("CAIXA_TRANSFERENCIA_MESMO", "Origem e destino precisam ser caixas diferentes")
        }
        val destinoCaixa = repository.buscarCaixa(request.idCaixaDestino)
            ?: throw RecursoNaoEncontrado("Caixa ${request.idCaixaDestino} não encontrado")
        if (destinoCaixa.caixa.idFilial != origem.idFilial) {
            throw invalido("CAIXA_TRANSFERENCIA_FILIAL", "A transferência precisa ser na mesma filial")
        }
        val destino = repository.buscarSessaoAberta(request.idCaixaDestino)
            ?: throw invalido("CAIXA_DESTINO_FECHADO", "Abra o caixa de destino antes de transferir")
        val valores = validarValores(request.conferencia)
        if (valores.isEmpty()) {
            throw invalido("CAIXA_VALOR_INVALIDO", "Informe ao menos um valor para transferir")
        }
        val saldos = origem.saldos.associate { (it.idFinalizador to it.moeda) to it.valor }
        for (linha in valores) {
            val tem = saldos[linha.idFinalizador to linha.moeda] ?: 0.0
            if (linha.valor > tem + 0.009) {
                throw invalido("CAIXA_SALDO_INSUFICIENTE", "Saldo insuficiente para transferir")
            }
        }
        repository.transferir(
            idSessaoOrigem,
            destino.id,
            valores,
            idUsuario,
            request.observacao?.trim()?.ifBlank { null },
        )
    }

    suspend fun buscarSessao(id: Long, idUsuario: Long): CaixaSessaoResponse {
        val detalhe = repository.buscarSessao(id) ?: throw RecursoNaoEncontrado("Sessão $id não encontrada")
        exigirAcessoFilial(idUsuario, detalhe.idFilial)
        return detalhe.toResponse(nomesFinalizadores())
    }

    suspend fun listarSessoes(idCaixa: Long, idUsuario: Long): List<CaixaSessaoResponse> {
        val caixa = repository.buscarCaixa(idCaixa) ?: throw RecursoNaoEncontrado("Caixa $idCaixa não encontrado")
        exigirAcessoFilial(idUsuario, caixa.caixa.idFilial)
        val nomes = nomesFinalizadores()
        return repository.listarSessoes(idCaixa).map { it.toResponse(nomes) }
    }

    suspend fun listarMovimentacoes(idSessao: Long, idUsuario: Long): List<CaixaMovimentacaoResponse> {
        val sessao = buscarSessao(idSessao, idUsuario)
        return repository.listarMovimentacoes(sessao.id).map { it.toResponse() }
    }

    suspend fun exigirSessaoAbertaComAcesso(idSessao: Long, idUsuario: Long, idFilial: Long): SessaoDetalhe {
        val detalhe = repository.buscarSessao(idSessao) ?: throw RecursoNaoEncontrado("Sessão $idSessao não encontrada")
        if (detalhe.idFilial != idFilial) {
            throw invalido("CAIXA_FILIAL_DIVERGENTE", "O caixa não pertence a esta filial")
        }
        exigirAcessoCaixa(idUsuario, detalhe.sessao.idCaixa)
        if (detalhe.sessao.status != StatusSessaoCaixa.ABERTO) {
            throw invalido("CAIXA_SESSAO_FECHADA", "A sessão do caixa está fechada")
        }
        return detalhe
    }

    suspend fun resolverSessaoVenda(idUsuario: Long, idFilial: Long, idSessao: Long?): SessaoDetalhe {
        if (idSessao != null) {
            return exigirSessaoAbertaComAcesso(idSessao, idUsuario, idFilial)
        }
        val acessos = repository.listarAcessos(idUsuario).filter { it.idFilial == idFilial }
        val escolhido = acessos.firstOrNull { it.padrao } ?: acessos.firstOrNull()
            ?: throw invalido("CAIXA_ACESSO_AUSENTE", "O usuário não tem caixa nesta filial")
        val aberta = repository.buscarSessaoAberta(escolhido.id)
            ?: throw invalido("CAIXA_SESSAO_AUSENTE", "Abra o caixa antes de vender")
        return exigirSessaoAbertaComAcesso(aberta.id, idUsuario, idFilial)
    }

    private fun validarFinalizador(request: FinalizadorRequest, id: Long): Finalizador {
        val nome = Texto.titleCase(request.nome.trim())
        if (nome.isEmpty()) throw invalido("FINALIZADOR_NOME_OBRIGATORIO", "O nome do finalizador é obrigatório")
        if (request.status == Status.DELETADO) throw invalido("USE_DELETE", "Use DELETE para marcar como deletado")
        return Finalizador(id = id, nome = nome, tipo = request.tipo, status = request.status)
    }

    private fun validarCaixa(request: CaixaRequest, id: Long, idFilial: Long): Caixa {
        val nome = Texto.titleCase(request.nome.trim())
        if (nome.isEmpty()) throw invalido("CAIXA_NOME_OBRIGATORIO", "O nome do caixa é obrigatório")
        if (request.status == Status.DELETADO) throw invalido("USE_DELETE", "Use DELETE para marcar como deletado")
        return Caixa(id = id, idFilial = idFilial, nome = nome, status = request.status)
    }

    private suspend fun validarValores(linhas: List<ValorFinalizadorRequest>): List<ValorFinalizador> {
        val agrupado = mutableMapOf<Pair<Long, Moeda>, Double>()
        for (linha in linhas) {
            if (linha.valor < 0) throw invalido("CAIXA_VALOR_INVALIDO", "O valor não pode ser negativo")
            repository.buscarFinalizador(linha.idFinalizador)
                ?: throw RecursoNaoEncontrado("Finalizador ${linha.idFinalizador} não encontrado")
            val chave = linha.idFinalizador to linha.moeda
            agrupado[chave] = (agrupado[chave] ?: 0.0) + linha.valor
        }
        return agrupado.map { (chave, valor) ->
            val pyg = if (chave.second == Moeda.PYG) kotlin.math.round(valor) else 0.0
            ValorFinalizador(
                idFinalizador = chave.first,
                valor = valor,
                moeda = chave.second,
                valorPyg = pyg,
            )
        }
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

    private suspend fun exigirAcessoCaixa(idUsuario: Long, idCaixa: Long) {
        if (repository.temAcessoCaixa(idUsuario, idCaixa)) return
        val usuario = usuarioRepository.buscar(idUsuario)
        val perfil = usuario?.perfil
        if (perfil == com.monarca.usuario.domain.PerfilUsuario.ADMINISTRADOR ||
            perfil == com.monarca.usuario.domain.PerfilUsuario.GESTOR
        ) {
            return
        }
        throw acesso("SEM_ACESSO_CAIXA", "Sem acesso a este caixa")
    }

    private suspend fun nomesFinalizadores(): Map<Long, String> =
        repository.listarFinalizadores().associate { it.id to it.nome }

    private fun Finalizador.toResponse() = FinalizadorResponse(id = id, nome = nome, tipo = tipo, status = status)

    private fun SessaoDetalhe.toResponse(nomes: Map<Long, String>) = CaixaSessaoResponse(
            id = sessao.id,
            idCaixa = sessao.idCaixa,
            caixaNome = caixaNome,
            idFilial = idFilial,
            data = sessao.data,
            abertoEm = sessao.abertoEm,
            fechadoEm = sessao.fechadoEm,
            idUsuarioAbertura = sessao.idUsuarioAbertura,
            usuarioAberturaNome = usuarioAberturaNome,
            idUsuarioFechamento = sessao.idUsuarioFechamento,
            observacaoFechamento = sessao.observacaoFechamento,
            observacaoAbertura = sessao.observacaoAbertura,
            status = sessao.status,
            saldos = saldos.map {
                ValorFinalizadorResponse(
                    idFinalizador = it.idFinalizador,
                    finalizadorNome = nomes[it.idFinalizador],
                    valor = it.valor,
                    moeda = it.moeda,
                    valorPyg = it.valorPyg,
                )
            },
        )

    private fun MovimentacaoDetalhe.toResponse() = CaixaMovimentacaoResponse(
        id = movimento.id,
        idCaixaSessao = movimento.idCaixaSessao,
        tipo = movimento.tipo,
        idUsuario = movimento.idUsuario,
        usuarioNome = usuarioNome,
        idVenda = movimento.idVenda,
        criadoEm = movimento.criadoEm,
        observacao = movimento.observacao,
        finalizadores = movimento.finalizadores.map {
            ValorFinalizadorResponse(
                idFinalizador = it.idFinalizador,
                finalizadorNome = finalizadorNomes[it.idFinalizador],
                valor = it.valor,
                moeda = it.moeda,
                valorPyg = it.valorPyg,
            )
        },
    )
}
