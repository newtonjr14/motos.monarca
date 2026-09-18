package com.monarca.entrada.service

import com.monarca.entrada.repository.EntradaRepository
import com.monarca.entrada.repository.ExposedEntradaRepository
import org.koin.dsl.module
import java.time.ZoneId

val entradaModule = module {
    single<EntradaRepository> { ExposedEntradaRepository(get()) }
    single {
        EntradaService(
            repository = get(),
            cotacaoService = get(),
            caixaService = get(),
            empresaService = get(),
            usuarioRepository = get(),
            produtoRepository = get(),
            papelService = get(),
            tituloService = get(),
            zoneId = ZoneId.of("America/Asuncion"),
        )
    }
}
