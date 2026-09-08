package com.monarca.cotacao.service

import com.monarca.cotacao.repository.CotacaoRepository
import com.monarca.cotacao.repository.ExposedCotacaoRepository
import org.koin.dsl.module
import java.time.ZoneId

val cotacaoModule = module {
    single<CotacaoRepository> { ExposedCotacaoRepository(get()) }
    single { CotacaoService(get(), ZoneId.of("America/Asuncion")) }
}
