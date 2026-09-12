package com.monarca

import com.monarca.produto.ChassiIntervaloGrande
import com.monarca.produto.ChassiIntervaloInvalido
import com.monarca.produto.ChassiNumeros
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class ChassiNumerosTest {

    @Test
    fun `expande intervalo da nota fiscal em 50 chassis`() {
        val numeros = ChassiNumeros.expandirTexto("HD5BL2318SA063647~HD5BL2318SA063696")
        assertEquals(50, numeros.size)
        assertEquals("HD5BL2318SA063647", numeros.first())
        assertEquals("HD5BL2318SA063696", numeros.last())
    }

    @Test
    fun `rejeita intervalo com tamanho diferente`() {
        assertFailsWith<ChassiIntervaloInvalido> {
            ChassiNumeros.expandirTexto("ABC1~ABC22")
        }
    }

    @Test
    fun `rejeita intervalo maior que o maximo`() {
        assertFailsWith<ChassiIntervaloGrande> {
            ChassiNumeros.expandirTexto("N0001~N0600")
        }
    }
}
