package com.monarca

import io.ktor.server.config.ApplicationConfig
import io.ktor.server.testing.ApplicationTestBuilder

fun ApplicationTestBuilder.configure() {
    environment {
        config = ApplicationConfig("application.yaml")
    }
}
