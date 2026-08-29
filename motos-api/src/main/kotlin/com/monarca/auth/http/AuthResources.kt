package com.monarca.auth.http

import io.ktor.resources.Resource
import kotlinx.serialization.Serializable

@Serializable
@Resource("/auth/login")
class AuthLogin

@Serializable
@Resource("/auth/refresh")
class AuthRefresh

@Serializable
@Resource("/auth/logout")
class AuthLogout

@Serializable
@Resource("/auth/me")
class AuthMe

@Serializable
@Resource("/auth/senha")
class AuthSenha

@Serializable
@Resource("/auth/perfil")
class AuthPerfil
