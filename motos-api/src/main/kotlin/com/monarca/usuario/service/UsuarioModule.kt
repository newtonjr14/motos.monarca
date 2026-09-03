package com.monarca.usuario.service

import com.monarca.usuario.repository.ExposedUsuarioRepository
import com.monarca.usuario.repository.UsuarioRepository
import org.koin.dsl.module

val usuarioModule = module {
    single<UsuarioRepository> { ExposedUsuarioRepository(get(), get()) }
    single { UsuarioService(get(), get()) }
}
