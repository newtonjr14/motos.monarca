package com.monarca

import org.flywaydb.core.Flyway

data class JdbcCredenciais(
    val url: String,
    val user: String,
    val password: String,
    val seedCidades: Boolean = true,
)

fun jdbcUrlFromR2dbc(url: String): String {
    if (url.startsWith("r2dbc:h2:mem:///")) {
        return "jdbc:h2:mem:" + url.removePrefix("r2dbc:h2:mem:///")
    }
    return "jdbc:" + url.removePrefix("r2dbc:")
}

fun migrateDatabase(jdbcUrl: String, user: String, password: String) {
    Flyway.configure()
        .dataSource(jdbcUrl, user, password)
        .locations("classpath:db/migration")
        .baselineOnMigrate(true)
        .load()
        .migrate()
}
