package com.monarca.seed.service

import com.monarca.seed.repository.ExposedDemoSeedRepository
import org.koin.dsl.module

val seedModule = module {
    single { ExposedDemoSeedRepository(get()) }
    single {
        DemoSeedService(
            marcadores = get(),
            usuarioRepository = get(),
            empresaService = get(),
            localidadeService = get(),
            pessoaService = get(),
            papelService = get(),
            marcaService = get(),
            produtoService = get(),
            estoqueService = get(),
            cotacaoService = get(),
            caixaService = get(),
            vendaService = get(),
        )
    }
}
