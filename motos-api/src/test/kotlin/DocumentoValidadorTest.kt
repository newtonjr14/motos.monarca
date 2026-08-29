package com.monarca.pessoa.domain

import com.monarca.localidade.service.RequisicaoInvalida
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class DocumentoValidadorTest {

    @Test
    fun `cpf aceita formatado e grava so digitos`() {
        assertEquals("52998224725", DocumentoValidador.normalizarCpf("529.982.247-25"))
        assertEquals("52998224725", DocumentoValidador.normalizarCpf("52998224725"))
    }

    @Test
    fun `cpf invalido rejeita`() {
        assertFailsWith<RequisicaoInvalida> { DocumentoValidador.normalizarCpf("111.111.111-11") }
        assertFailsWith<RequisicaoInvalida> { DocumentoValidador.normalizarCpf("123") }
    }

    @Test
    fun `cnpj numerico aceita formatado`() {
        assertEquals("11222333000181", DocumentoValidador.normalizarCnpj("11.222.333/0001-81"))
    }

    @Test
    fun `cnpj alfanumerico valida dv`() {
        assertEquals("12ABC34501DE35", DocumentoValidador.normalizarCnpj("12.ABC.345/01DE-35"))
    }

    @Test
    fun `ci paraguai normaliza digitos`() {
        assertEquals("1234567", DocumentoValidador.normalizarCi("1.234.567"))
    }

    @Test
    fun `ruc paraguai valida dv`() {
        assertEquals("80009735-1", DocumentoValidador.normalizarRuc("80009735-1"))
        assertEquals("80009735-1", DocumentoValidador.normalizarRuc("800097351"))
    }

    @Test
    fun `ruc invalido rejeita`() {
        assertFailsWith<RequisicaoInvalida> { DocumentoValidador.normalizarRuc("80009735-9") }
    }
}
