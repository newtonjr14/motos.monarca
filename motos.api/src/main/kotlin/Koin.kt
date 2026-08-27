package com.monarca

import com.monarca.localidade.service.localidadeModule
import io.ktor.server.application.*
import org.koin.dsl.module
import org.koin.ktor.plugin.Koin
import org.koin.logger.slf4jLogger

fun Application.configureKoin() {
    val databaseUrl = environment.config.property("database.url").getString()
    val databaseUser = environment.config.property("database.user").getString()
    val databasePassword = environment.config.property("database.password").getString()
    log.info("Banco: $databaseUrl (user=$databaseUser)")

    install(Koin) {
        slf4jLogger()
        modules(
            module {
                single<HelloService> {
                    HelloService {
                        println(environment.log.info("Hello, World!"))
                    }
                }
            },
            localidadeModule(databaseUrl, databaseUser, databasePassword),
        )
    }
}
