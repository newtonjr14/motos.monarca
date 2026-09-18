package com.monarca.factura.service

import com.monarca.factura.repository.ExposedFacturaRepository
import com.monarca.factura.repository.FacturaRepository
import com.monarca.factura.sudtax.SudtaxClient
import com.monarca.factura.sudtax.SudtaxConfig
import io.ktor.server.application.Application
import org.koin.dsl.module

fun Application.sudtaxConfig(): SudtaxConfig {
    val cfg = environment.config.config("sudtax")
    return SudtaxConfig(
        enabled = cfg.propertyOrNull("enabled")?.getString()?.toBooleanStrictOrNull() ?: false,
        baseUrl = cfg.propertyOrNull("baseUrl")?.getString()?.trim().orEmpty(),
        apiKey = cfg.propertyOrNull("apiKey")?.getString()?.trim().orEmpty(),
    )
}

val facturaModule = module {
    single<FacturaRepository> { ExposedFacturaRepository(get()) }
    single { SudtaxClient(get()) }
    single {
        DocumentoEletronicoService(
            vendaRepository = get(),
            empresaService = get(),
            papelService = get(),
            caixaService = get(),
            usuarioRepository = get(),
        )
    }
    single {
        FacturaService(
            repository = get(),
            documentoEletronico = get(),
            sudtaxClient = get(),
            cotacaoService = get(),
            vendaRepository = get(),
            usuarioRepository = get(),
            empresaService = get(),
        )
    }
}
