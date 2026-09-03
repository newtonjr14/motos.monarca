package com.monarca.estoque.service

import com.monarca.estoque.repository.EstoqueRepository
import com.monarca.estoque.repository.ExposedEstoqueRepository
import org.koin.dsl.module

val estoqueModule = module {
    single<EstoqueRepository> { ExposedEstoqueRepository(get()) }
    single { EstoqueService(get(), get(), get(), get()) }
}
