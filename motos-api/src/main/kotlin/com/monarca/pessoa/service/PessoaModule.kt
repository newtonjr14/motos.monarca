package com.monarca.pessoa.service

import com.monarca.pessoa.repository.ExposedPessoaRepository
import com.monarca.pessoa.repository.PessoaRepository
import org.koin.dsl.module

val pessoaModule = module {
    single<PessoaRepository> { ExposedPessoaRepository(get()) }
    single { PessoaService(get(), get()) }
    single { PapelService(get(), get(), get()) }
}
