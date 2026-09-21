package com.monarca.usuario

/** Usuário bootstrap `system`. Senha inicial só na 1ª criação — nunca sobrescrita no boot. */
object SystemUser {
    const val LOGIN = "system"
    const val NOME = "System"
    const val EMAIL = "system@monarca.local"
    /** Fallback se `system.initialPassword` não estiver no yaml (só 1ª criação). */
    const val DEFAULT_INITIAL_PASSWORD = "System@250623"

    fun isSystem(login: String): Boolean = login.equals(LOGIN, ignoreCase = false)
}

data class SystemBootstrapConfig(
    val initialPassword: String,
)
