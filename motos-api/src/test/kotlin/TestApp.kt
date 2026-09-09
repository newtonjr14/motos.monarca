package com.monarca

import io.ktor.server.config.ApplicationConfig
import io.ktor.server.config.MapApplicationConfig
import io.ktor.server.config.mergeWith
import io.ktor.server.testing.ApplicationTestBuilder

private val coroutinesTestTimeout =
    System.setProperty("kotlinx.coroutines.test.default_timeout", "60s")

fun ApplicationTestBuilder.configure(seedDemo: Boolean = true) {
    checkNotNull(coroutinesTestTimeout)
    environment {
        config = ApplicationConfig("application.yaml").mergeWith(
            MapApplicationConfig("seed.demo" to seedDemo.toString()),
        )
    }
}
