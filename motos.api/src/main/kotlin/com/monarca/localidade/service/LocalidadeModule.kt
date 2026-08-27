package com.monarca.localidade.service

import com.monarca.localidade.repository.ExposedLocalidadeRepository
import com.monarca.localidade.repository.LocalidadeRepository
import org.jetbrains.exposed.v1.r2dbc.R2dbcDatabase
import org.koin.dsl.module

fun localidadeModule(
    url: String,
    user: String,
    password: String,
) = module {
    single {
        R2dbcDatabase.connect(
            url = url,
            user = user,
            password = password,
        )
    }
    single<LocalidadeRepository> { ExposedLocalidadeRepository(get()) }
    single { LocalidadeService(get()) }
}
