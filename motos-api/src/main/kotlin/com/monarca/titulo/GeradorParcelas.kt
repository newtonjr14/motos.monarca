package com.monarca.titulo

import com.monarca.produto.domain.Moeda
import com.monarca.titulo.domain.ModoVencimento
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import kotlin.math.round

data class ParcelaGerada(
    val numero: Int,
    val vencimento: String,
    val valor: Double,
    val valorPyg: Double,
)

object GeradorParcelas {
    private val fmt = DateTimeFormatter.ISO_LOCAL_DATE

    fun gerar(
        valorTotal: Double,
        valorTotalPyg: Double,
        quantidade: Int,
        dataBase: LocalDate,
        modo: ModoVencimento,
        diaVencimento: Int?,
        moeda: Moeda,
    ): List<ParcelaGerada> {
        require(quantidade >= 1) { "quantidade" }
        val vencimentos = (1..quantidade).map { n ->
            when (modo) {
                ModoVencimento.INTERVALO_30 -> dataBase.plusDays(30L * n)
                ModoVencimento.DIA_FIXO -> {
                    val dia = diaVencimento ?: throw IllegalArgumentException("dia")
                    vencimentoDiaFixo(dataBase, dia, n)
                }
            }
        }
        val valores = ratear(valorTotal, quantidade, moeda)
        val valoresPyg = ratear(valorTotalPyg, quantidade, Moeda.PYG)
        return valores.indices.map { i ->
            ParcelaGerada(
                numero = i + 1,
                vencimento = vencimentos[i].format(fmt),
                valor = valores[i],
                valorPyg = valoresPyg[i],
            )
        }
    }

    private fun vencimentoDiaFixo(dataBase: LocalDate, dia: Int, numeroParcela: Int): LocalDate {
        val d = dia.coerceIn(1, 28)
        var base = dataBase.withDayOfMonth(minOf(d, dataBase.lengthOfMonth()))
        if (!dataBase.isBefore(base)) {
            base = base.plusMonths(1).withDayOfMonth(minOf(d, base.plusMonths(1).lengthOfMonth()))
        }
        return base.plusMonths((numeroParcela - 1).toLong()).withDayOfMonth(
            minOf(d, base.plusMonths((numeroParcela - 1).toLong()).lengthOfMonth()),
        )
    }

    private fun ratear(total: Double, qtd: Int, moeda: Moeda): List<Double> {
        if (qtd == 1) return listOf(arredondar(total, moeda))
        val unidade = arredondar(total / qtd, moeda)
        val partes = MutableList(qtd) { unidade }
        val soma = partes.sumOf { it }
        partes[qtd - 1] = arredondar(partes[qtd - 1] + (total - soma), moeda)
        return partes
    }

    private fun arredondar(valor: Double, moeda: Moeda): Double =
        if (moeda == Moeda.PYG) round(valor) else round(valor * 100.0) / 100.0
}
