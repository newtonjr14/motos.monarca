package com.monarca.pessoa.domain

import com.monarca.localidade.service.RequisicaoInvalida

/**
 * Normaliza e valida documentos de catálogo conhecidos (BR/PY).
 * Outros tipos/países não passam por aqui — apenas normalização genérica no service.
 */
object DocumentoValidador {

    fun normalizarPorCodigo(codigo: String, numero: String): String = when (codigo.uppercase()) {
        "CPF" -> normalizarCpf(numero)
        "CNPJ" -> normalizarCnpj(numero)
        "CI" -> normalizarCi(numero)
        "RUC" -> normalizarRuc(numero)
        else -> throw IllegalArgumentException("Código de documento não suportado: $codigo")
    }

    fun temValidacao(codigo: String): Boolean =
        codigo.uppercase() in setOf("CPF", "CNPJ", "CI", "RUC")

    fun normalizarCpf(numero: String): String {
        val digits = numero.filter { it.isDigit() }
        if (digits.length != 11) {
            throw RequisicaoInvalida("CPF deve ter 11 dígitos")
        }
        if (digits.all { it == digits[0] }) {
            throw RequisicaoInvalida("CPF inválido")
        }
        if (!cpfDigitoVerificadorValido(digits)) {
            throw RequisicaoInvalida("CPF inválido")
        }
        return digits
    }

    fun normalizarCnpj(numero: String): String {
        val limpo = numero.filter { it.isLetterOrDigit() }.uppercase()
        if (limpo.length != 14) {
            throw RequisicaoInvalida("CNPJ deve ter 14 caracteres")
        }
        val base = limpo.substring(0, 12)
        val dv = limpo.substring(12)
        if (!base.all { it.isDigit() || it in 'A'..'Z' }) {
            throw RequisicaoInvalida("CNPJ inválido")
        }
        if (!dv.all { it.isDigit() }) {
            throw RequisicaoInvalida("CNPJ inválido: os dois últimos caracteres devem ser numéricos")
        }
        if (limpo.all { it == '0' }) {
            throw RequisicaoInvalida("CNPJ inválido")
        }
        val dvCalculado = calcularDvCnpj(base)
        if (dv != dvCalculado) {
            throw RequisicaoInvalida("CNPJ inválido")
        }
        return limpo
    }

    fun normalizarCi(numero: String): String {
        val digits = numero.filter { it.isDigit() }
        if (digits.length !in 6..10) {
            throw RequisicaoInvalida("Cédula (CI) deve ter entre 6 e 10 dígitos")
        }
        return digits
    }

    fun normalizarRuc(numero: String): String {
        val semEspaco = numero.trim().filter { it.isDigit() || it == '-' }
        val (base, dv) = when {
            '-' in semEspaco -> {
                val partes = semEspaco.split('-').filter { it.isNotEmpty() }
                if (partes.size != 2) {
                    throw RequisicaoInvalida("RUC inválido: use formato 1234567-8")
                }
                partes[0] to partes[1]
            }
            else -> {
                if (semEspaco.length < 2) {
                    throw RequisicaoInvalida("RUC inválido")
                }
                semEspaco.dropLast(1) to semEspaco.takeLast(1)
            }
        }
        if (!base.all { it.isDigit() } || base.length !in 3..8) {
            throw RequisicaoInvalida("RUC inválido: base deve ter 3 a 8 dígitos")
        }
        if (dv.length != 1 || !dv[0].isDigit()) {
            throw RequisicaoInvalida("RUC inválido: dígito verificador incorreto")
        }
        val dvCalculado = calcularDvRucParaguay(base)
        if (dv.toInt() != dvCalculado) {
            throw RequisicaoInvalida("RUC inválido")
        }
        return "$base-$dv"
    }

    /** CPF — módulo 11 clássico. */
    private fun cpfDigitoVerificadorValido(digits: String): Boolean {
        fun dv(parcial: String, pesoInicial: Int): Int {
            var soma = 0
            for (i in parcial.indices) {
                soma += (parcial[i] - '0') * (pesoInicial - i)
            }
            val resto = soma % 11
            return if (resto < 2) 0 else 11 - resto
        }
        val d1 = dv(digits.substring(0, 9), 10)
        val d2 = dv(digits.substring(0, 10), 11)
        return digits[9].digitToInt() == d1 && digits[10].digitToInt() == d2
    }

    /**
     * CNPJ numérico e alfanumérico (Receita Federal): valor = ASCII − 48;
     * pesos 5,4,3,2,9,8,7,6,5,4,3,2 e 6,5,4,3,2,9,8,7,6,5,4,3,2.
     */
    private fun calcularDvCnpj(base12: String): String {
        val pesos1 = intArrayOf(5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2)
        val pesos2 = intArrayOf(6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2)

        var soma = 0
        for (i in 0 until 12) {
            soma += valorModulo11Cnpj(base12[i]) * pesos1[i]
        }
        var resto = soma % 11
        val dv1 = if (resto < 2) 0 else 11 - resto

        soma = 0
        val comDv1 = base12 + dv1.toString()
        for (i in 0 until 13) {
            soma += valorModulo11Cnpj(comDv1[i]) * pesos2[i]
        }
        resto = soma % 11
        val dv2 = if (resto < 2) 0 else 11 - resto
        return "$dv1$dv2"
    }

    private fun valorModulo11Cnpj(c: Char): Int = c.code - 48

    /** RUC Paraguay — módulo 11 (DNIT/SET), pesos 2..11 da direita para esquerda. */
    private fun calcularDvRucParaguay(base: String): Int {
        var k = 2
        var total = 0
        for (c in base.reversed()) {
            if (k > 11) k = 2
            total += (c - '0') * k
            k++
        }
        val resto = total % 11
        return if (resto > 1) 11 - resto else 0
    }
}
