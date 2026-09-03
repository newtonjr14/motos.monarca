package com.monarca.produto.service

import com.monarca.produto.repository.ExposedMarcaRepository
import com.monarca.produto.repository.ExposedProdutoRepository
import com.monarca.produto.repository.MarcaRepository
import com.monarca.produto.repository.ProdutoRepository
import org.koin.dsl.module

val produtoModule = module {
    single<ProdutoRepository> { ExposedProdutoRepository(get()) }
    single<MarcaRepository> { ExposedMarcaRepository(get()) }
    single { ProdutoService(get(), get(), get(), get()) }
    single { MarcaService(get()) }
}
