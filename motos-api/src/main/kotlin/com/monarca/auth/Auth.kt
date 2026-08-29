package com.monarca.auth

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import com.monarca.auth.domain.Rbac
import com.monarca.auth.domain.UsuarioAutenticado
import com.monarca.auth.dto.MensagemErro
import com.monarca.usuario.domain.PerfilUsuario
import io.ktor.http.HttpStatusCode
import io.ktor.server.application.Application
import io.ktor.server.application.install
import io.ktor.server.auth.Authentication
import io.ktor.server.auth.authenticate
import io.ktor.server.auth.jwt.JWTPrincipal
import io.ktor.server.auth.jwt.jwt
import io.ktor.server.response.respond
import io.ktor.server.routing.Route

const val JWT_AUTH = "jwt-auth"

fun Application.configureAuthentication() {
    val config = jwtConfig()
    install(Authentication) {
        jwt(JWT_AUTH) {
            realm = config.realm
            verifier(
                JWT.require(Algorithm.HMAC256(config.secret))
                    .withAudience(config.audience)
                    .withIssuer(config.issuer)
                    .build(),
            )
            validate { credential ->
                val id = credential.payload.getClaim("id").asLong() ?: return@validate null
                val login = credential.payload.getClaim("login").asString() ?: return@validate null
                val perfilRaw = credential.payload.getClaim("perfil").asString() ?: return@validate null
                val perfil = runCatching { PerfilUsuario.valueOf(perfilRaw.uppercase()) }.getOrNull()
                    ?: return@validate null
                val permissoes = credential.payload.getClaim("permissoes").asList(String::class.java)?.toSet()
                    ?: Rbac.codigos(perfil)
                UsuarioAutenticado(id, login, perfil, permissoes)
            }
            challenge { _, _ ->
                call.respond(HttpStatusCode.Unauthorized, MensagemErro("Token inválido ou expirado"))
            }
        }
    }
}

fun Route.autenticado(block: Route.() -> Unit) {
    authenticate(JWT_AUTH, build = block)
}
