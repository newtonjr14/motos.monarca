package com.monarca.auth

import java.util.concurrent.ConcurrentHashMap

/**
 * Limite simples em memória por chave (IP).
 * Reinicia com a JVM — suficiente para mitigar força bruta no login.
 */
class LoginRateLimiter(
    private val maxAttempts: Int = 20,
    private val windowMs: Long = 60_000L,
) {
    private data class Bucket(var count: Int, var windowStart: Long)

    private val buckets = ConcurrentHashMap<String, Bucket>()

    fun allow(key: String): Boolean {
        if (maxAttempts <= 0) return true
        val agora = System.currentTimeMillis()
        val bucket = buckets.compute(key) { _, atual ->
            when {
                atual == null || agora - atual.windowStart >= windowMs -> Bucket(1, agora)
                else -> {
                    atual.count += 1
                    atual
                }
            }
        }!!
        return bucket.count <= maxAttempts
    }
}
