package com.monarca.seed.http

import io.ktor.resources.Resource
import kotlinx.serialization.Serializable

@Serializable
@Resource("/seed/demo")
class SeedDemo
