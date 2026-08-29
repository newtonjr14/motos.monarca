package com.monarca.auth.service

import com.monarca.auth.JwtService
import com.monarca.auth.repository.ExposedRefreshTokenRepository
import com.monarca.auth.repository.RefreshTokenRepository
import org.koin.dsl.module

val authModule = module {
    single { JwtService(get()) }
    single<RefreshTokenRepository> { ExposedRefreshTokenRepository(get()) }
    single { AuthService(get(), get(), get()) }
}
