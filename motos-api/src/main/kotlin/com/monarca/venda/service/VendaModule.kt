package com.monarca.venda.service

import com.monarca.venda.repository.ExposedVendaRepository
import com.monarca.venda.repository.VendaRepository
import org.koin.dsl.module

val vendaModule = module {
    single<VendaRepository> { ExposedVendaRepository(get()) }
    single { VendaService(get(), get(), get(), get(), get(), get(), get()) }
}
