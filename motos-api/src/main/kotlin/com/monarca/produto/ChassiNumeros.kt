package com.monarca.produto

object ChassiNumeros {
    const val MAXIMO = 500

    fun normalizar(valor: String): String =
        valor.trim().uppercase().replace(" ", "")

    fun expandirLista(itens: List<String>): List<String> {
        val saida = mutableListOf<String>()
        for (item in itens) {
            val bruto = item.trim()
            if (bruto.isEmpty()) continue
            if (bruto.contains("~")) {
                saida += expandirIntervalo(bruto)
            } else {
                val n = normalizar(bruto)
                if (n.isNotEmpty()) saida += n
            }
        }
        return saida
    }

    fun expandirTexto(texto: String): List<String> {
        val partes = texto.split('\n', '\r', ',', ';')
        return expandirLista(partes)
    }

    fun expandirIntervalo(texto: String): List<String> {
        val partes = texto.split("~", limit = 2)
        if (partes.size != 2) {
            val unico = normalizar(texto)
            return if (unico.isEmpty()) emptyList() else listOf(unico)
        }
        val inicio = normalizar(partes[0])
        val fim = normalizar(partes[1])
        if (inicio.isEmpty() || fim.isEmpty()) {
            throw ChassiIntervaloInvalido()
        }
        if (inicio == fim) return listOf(inicio)
        if (inicio.length != fim.length) {
            throw ChassiIntervaloInvalido()
        }
        var i = 0
        while (i < inicio.length && inicio[i] == fim[i]) i++
        val prefixo = inicio.substring(0, i)
        val sufixoIni = inicio.substring(i)
        val sufixoFim = fim.substring(i)
        if (sufixoIni.isEmpty() || !sufixoIni.all { it.isDigit() } || !sufixoFim.all { it.isDigit() }) {
            throw ChassiIntervaloInvalido()
        }
        val de = sufixoIni.toLong()
        val ate = sufixoFim.toLong()
        if (ate < de) throw ChassiIntervaloInvalido()
        val qtd = ate - de + 1
        if (qtd > MAXIMO) throw ChassiIntervaloGrande(MAXIMO)
        val largura = sufixoIni.length
        return (de..ate).map { n -> prefixo + n.toString().padStart(largura, '0') }
    }
}

class ChassiIntervaloInvalido : RuntimeException("Intervalo de chassi inválido")
class ChassiIntervaloGrande(val maximo: Int) : RuntimeException("Intervalo de chassi maior que $maximo")
