package com.monarca.auth

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import com.monarca.auth.domain.Rbac
import com.monarca.usuario.domain.PerfilUsuario
import com.monarca.usuario.domain.Usuario
import java.util.Date

class JwtService(
    private val config: JwtConfig,
) {
    private val algorithm = Algorithm.HMAC256(config.secret)

    fun gerarAccessToken(usuario: Usuario): String {
        val agora = Date()
        val expira = Date(agora.time + config.accessExpirationMinutes * 60_000)
        val permissoes = Rbac.codigos(usuario.perfil)
        return JWT.create()
            .withIssuer(config.issuer)
            .withAudience(config.audience)
            .withSubject(usuario.id.toString())
            .withClaim("id", usuario.id)
            .withClaim("login", usuario.login)
            .withClaim("perfil", usuario.perfil.name.lowercase())
            .withClaim("permissoes", permissoes.toList())
            .withIssuedAt(agora)
            .withExpiresAt(expira)
            .sign(algorithm)
    }

    fun accessExpirationSeconds(): Long = config.accessExpirationMinutes * 60

    fun refreshExpirationMillis(): Long = config.refreshExpirationDays * 24 * 60 * 60 * 1000

    fun perfilFromClaim(valor: String?): PerfilUsuario? = runCatching {
        PerfilUsuario.valueOf(valor!!.uppercase())
    }.getOrNull()
}
