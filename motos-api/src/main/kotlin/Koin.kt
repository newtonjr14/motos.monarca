package com.monarca

import com.monarca.audit.service.auditModule
import com.monarca.auth.jwtConfig
import com.monarca.auth.service.authModule
import com.monarca.empresa.service.empresaModule
import com.monarca.estoque.service.estoqueModule
import com.monarca.localidade.service.localidadeModule
import com.monarca.pessoa.service.pessoaModule
import com.monarca.produto.service.produtoModule
import com.monarca.usuario.service.usuarioModule
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
            },
            auditModule,
            authModule,
            localidadeModule,
            usuarioModule,
            empresaModule,
            pessoaModule,
            produtoModule,
            estoqueModule,
        )
    }
}
