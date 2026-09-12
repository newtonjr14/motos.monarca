package com.monarca.localidade.repository

import java.text.Normalizer

internal data class MunicipioSeed(val chaveDivisao: String, val nome: String)
internal data class DistritoSeed(val chaveDivisao: String, val nome: String, val municipio: String)

internal fun foldNome(valor: String): String {
    val nfd = Normalizer.normalize(valor.trim(), Normalizer.Form.NFD)
    return nfd.replace(Regex("\\p{M}+"), "").lowercase()
}

internal fun lerMunicipiosBr(): List<MunicipioSeed> =
    lerCsv("/localidade/br-municipios.csv").map { MunicipioSeed(it[0], it[1]) }

internal fun lerDistritosBr(): List<DistritoSeed> =
    lerCsv("/localidade/br-distritos.csv").map { DistritoSeed(it[0], it[1], it[2]) }

internal fun lerMunicipiosPy(): List<MunicipioSeed> =
    lerCsv("/localidade/py-municipios.csv").map { MunicipioSeed(it[0], it[1]) }

private object CidadeSeedRecursos

private fun lerCsv(recurso: String): List<List<String>> {
    val stream = CidadeSeedRecursos::class.java.getResourceAsStream(recurso)
        ?: error("Recurso $recurso não encontrado")
    return stream.bufferedReader(Charsets.UTF_8).use { reader ->
        reader.lineSequence()
            .drop(1)
            .map { it.trim() }
            .filter { it.isNotEmpty() }
            .map { linha -> parseCsv(linha) }
            .toList()
    }
}

private fun parseCsv(linha: String): List<String> {
    val out = mutableListOf<String>()
    val atual = StringBuilder()
    var aspas = false
    for (c in linha) {
        when {
            c == '"' -> aspas = !aspas
            c == ',' && !aspas -> {
                out += atual.toString()
                atual.clear()
            }
            else -> atual.append(c)
        }
    }
    out += atual.toString()
    return out
}
