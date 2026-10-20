package com.monarca.devolucao.service

import com.monarca.devolucao.repository.DevolucaoRepository
import com.monarca.devolucao.repository.ExposedDevolucaoRepository
import org.koin.dsl.module

val devolucaoModule = module {
    single<DevolucaoRepository> { ExposedDevolucaoRepository(get()) }
    single {
        DevolucaoService(
            repository = get(),
            caixaService = get(),
            empresaService = get(),
            usuarioRepository = get(),
        )
    }
}
