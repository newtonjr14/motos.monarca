package com.monarca.caixa.service

import com.monarca.caixa.repository.CaixaRepository
import com.monarca.caixa.repository.ExposedCaixaRepository
import org.koin.dsl.module
import java.time.ZoneId

val caixaModule = module {
    single<CaixaRepository> { ExposedCaixaRepository(get()) }
    single { CaixaService(get(), get(), get(), ZoneId.of("America/Asuncion")) }
}
