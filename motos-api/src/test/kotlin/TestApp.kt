package com.monarca

import io.ktor.server.config.ApplicationConfig
import io.ktor.server.testing.ApplicationTestBuilder

private val coroutinesTestTimeout =
    System.setProperty("kotlinx.coroutines.test.default_timeout", "60s")

fun ApplicationTestBuilder.configure() {
    checkNotNull(coroutinesTestTimeout)
    environment {
        config = ApplicationConfig("application.yaml")
    }
}
