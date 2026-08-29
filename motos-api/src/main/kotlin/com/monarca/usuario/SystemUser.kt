package com.monarca.usuario

object SystemUser {
    const val LOGIN = "system"
    const val NOME = "System"
    const val EMAIL = "system@monarca.local"
    const val SENHA = "System@250623"

    fun isSystem(login: String): Boolean = login.equals(LOGIN, ignoreCase = false)
}
