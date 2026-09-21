package com.monarca

import com.monarca.audit.service.auditModule
import com.monarca.auth.LoginRateLimiter
import com.monarca.auth.jwtConfig
import com.monarca.auth.service.authModule
import com.monarca.caixa.service.caixaModule
import com.monarca.cotacao.service.cotacaoModule
import com.monarca.empresa.service.empresaModule
import com.monarca.estoque.service.estoqueModule
import com.monarca.localidade.service.localidadeModule
import com.monarca.pessoa.service.pessoaModule
import com.monarca.produto.service.produtoModule
import com.monarca.seed.service.seedModule
import com.monarca.entrada.service.entradaModule
import com.monarca.factura.service.facturaModule
import com.monarca.factura.service.sudtaxConfig
import com.monarca.titulo.service.tituloModule
import com.monarca.usuario.SystemBootstrapConfig
import com.monarca.usuario.SystemUser
import com.monarca.usuario.service.usuarioModule
import com.monarca.venda.service.vendaModule
import io.ktor.server.application.Application
import io.ktor.server.application.install
import io.ktor.server.application.log
import org.jetbrains.exposed.v1.r2dbc.R2dbcDatabase
import org.koin.dsl.module
import org.koin.ktor.plugin.Koin
import org.koin.logger.slf4jLogger

fun Application.configureKoin() {
    val databaseUrl = environment.config.property("database.url").getString()
    val databaseUser = environment.config.property("database.user").getString()
    val databasePassword = environment.config.property("database.password").getString()
    val jdbcUrl = jdbcUrlFromR2dbc(databaseUrl)
    log.info("Banco: $databaseUrl (user=$databaseUser)")
    migrateDatabase(jdbcUrl, databaseUser, databasePassword)

    val jwt = jwtConfig()
    val sudtax = sudtaxConfig()
    val seedCidades = environment.config.propertyOrNull("seed.cidades")?.getString()?.toBooleanStrictOrNull() ?: true
    val systemPassword = environment.config.propertyOrNull("system.initialPassword")
        ?.getString()
        ?.trim()
        ?.takeIf { it.isNotEmpty() }
        ?: SystemUser.DEFAULT_INITIAL_PASSWORD
    val loginMax = environment.config.propertyOrNull("auth.loginMaxAttempts")
        ?.getString()
        ?.toIntOrNull()
        ?: 20
    val loginWindow = environment.config.propertyOrNull("auth.loginWindowSeconds")
        ?.getString()
        ?.toLongOrNull()
        ?.times(1000)
        ?: 60_000L

    install(Koin) {
        slf4jLogger()
        modules(
            module {
                single {
                    R2dbcDatabase.connect(
                        url = databaseUrl,
                        user = databaseUser,
                        password = databasePassword,
                    )
                }
                single { jwt }
                single { sudtax }
                single { JdbcCredenciais(jdbcUrl, databaseUser, databasePassword, seedCidades) }
                single { SystemBootstrapConfig(initialPassword = systemPassword) }
                single { LoginRateLimiter(maxAttempts = loginMax, windowMs = loginWindow) }
            },
            auditModule,
            authModule,
            localidadeModule,
            usuarioModule,
            empresaModule,
            pessoaModule,
            produtoModule,
            estoqueModule,
            cotacaoModule,
            caixaModule,
            vendaModule,
            tituloModule,
            entradaModule,
            facturaModule,
            seedModule,
        )
    }
}
