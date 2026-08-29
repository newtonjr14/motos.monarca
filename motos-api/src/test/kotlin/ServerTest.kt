package com.monarca

import io.ktor.client.request.get
import io.ktor.http.HttpStatusCode
import io.ktor.server.testing.testApplication
import kotlin.test.Test
import kotlin.test.assertEquals

class ServerTest {

    @Test
    fun `health endpoint responde ok`() = testApplication {
        configure()
        assertEquals(HttpStatusCode.OK, client.get("/health").status)
    }

    @Test
    fun `api sobe e lista paises`() = testApplication {
        configure()
        withAuth { token ->
            assertEquals(HttpStatusCode.OK, client.get("/paises") { auth(token) }.status)
        }
    }
}
