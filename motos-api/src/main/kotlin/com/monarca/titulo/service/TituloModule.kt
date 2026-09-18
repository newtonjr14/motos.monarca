package com.monarca.titulo.service

import com.monarca.titulo.repository.ExposedTituloRepository
import com.monarca.titulo.repository.TituloRepository
import org.koin.dsl.module
import java.time.ZoneId

val tituloModule = module {
    single<TituloRepository> { ExposedTituloRepository(get()) }
    single {
        TituloService(
            repository = get(),
            cotacaoService = get(),
            empresaService = get(),
            papelService = get(),
            caixaService = get(),
            usuarioRepository = get(),
            zoneId = ZoneId.of("America/Asuncion"),
        )
    }
}
