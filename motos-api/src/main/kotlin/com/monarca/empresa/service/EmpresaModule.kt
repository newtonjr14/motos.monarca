package com.monarca.empresa.service

import com.monarca.empresa.repository.EmpresaRepository
import com.monarca.empresa.repository.ExposedEmpresaRepository
import org.koin.dsl.module

val empresaModule = module {
    single<EmpresaRepository> { ExposedEmpresaRepository(get()) }
    single { EmpresaService(get(), get()) }
}
