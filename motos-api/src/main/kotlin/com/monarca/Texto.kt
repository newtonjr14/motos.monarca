package com.monarca

import java.util.Locale

object Texto {
    private val locale = Locale.forLanguageTag("pt-BR")

    fun titleCase(valor: String): String =
        valor.trim().lowercase(locale).split(Regex("\\s+")).filter { it.isNotEmpty() }
            .joinToString(" ") { parte -> parte.replaceFirstChar { it.titlecase(locale) } }

    fun email(valor: String?): String? =
        valor?.trim()?.takeIf { it.isNotEmpty() }?.lowercase(locale)
}
