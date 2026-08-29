package com.monarca.auth

import io.ktor.server.application.Application

data class JwtConfig(
    val secret: String,
    val issuer: String,
    val audience: String,
    val realm: String,
    val accessExpirationMinutes: Long,
    val refreshExpirationDays: Long,
)

fun Application.jwtConfig(): JwtConfig {
    val config = environment.config.config("jwt")
    return JwtConfig(
        secret = config.property("secret").getString(),
        issuer = config.property("issuer").getString(),
        audience = config.property("audience").getString(),
        realm = config.property("realm").getString(),
        accessExpirationMinutes = config.property("accessExpirationMinutes").getString().toLong(),
        refreshExpirationDays = config.property("refreshExpirationDays").getString().toLong(),
    )
}
