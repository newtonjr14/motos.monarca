package com.monarca.usuario

import java.security.MessageDigest
import java.security.SecureRandom
import java.util.Base64
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.PBEKeySpec

object Senha {
    private const val ITERATIONS = 120_000
    private const val KEY_BITS = 256
    private val random = SecureRandom()

    fun hash(senha: String): String {
        val salt = ByteArray(16).also { random.nextBytes(it) }
        return "pbkdf2:${encode(salt)}:${encode(derive(senha, salt))}"
    }

    fun conferir(senha: String, senhaHash: String): Boolean {
        val partes = senhaHash.split(":")
        if (partes.size != 3 || partes[0] != "pbkdf2") return false
        val salt = decode(partes[1]) ?: return false
        val esperado = decode(partes[2]) ?: return false
        return MessageDigest.isEqual(esperado, derive(senha, salt))
    }

    private fun derive(senha: String, salt: ByteArray): ByteArray {
        val spec = PBEKeySpec(senha.toCharArray(), salt, ITERATIONS, KEY_BITS)
        return SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(spec).encoded
    }

    private fun encode(bytes: ByteArray): String = Base64.getEncoder().encodeToString(bytes)

    private fun decode(valor: String): ByteArray? = runCatching { Base64.getDecoder().decode(valor) }.getOrNull()
}
