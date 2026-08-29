package com.monarca.localidade.service

import com.monarca.localidade.repository.ExposedLocalidadeRepository
import com.monarca.localidade.repository.LocalidadeRepository
import org.koin.dsl.module

val localidadeModule = module {
    single<LocalidadeRepository> { ExposedLocalidadeRepository(get()) }
    single { LocalidadeService(get()) }
}
