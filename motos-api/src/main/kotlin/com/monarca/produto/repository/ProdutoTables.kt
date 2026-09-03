package com.monarca.produto.repository

import com.monarca.empresa.repository.FiliaisTable
import org.jetbrains.exposed.v1.core.dao.id.LongIdTable

object MarcasTable : LongIdTable("marca") {
    val nome = varchar("nome", 80)
    val status = varchar("status", 20).default("ativo")
}

object ModelosTable : LongIdTable("modelo") {
    val idMarca = reference("id_marca", MarcasTable)
    val nome = varchar("nome", 120)
    val tipo = varchar("tipo", 20)
    val status = varchar("status", 20).default("ativo")
}

object ProdutosTable : LongIdTable("produto") {
    val codigo = varchar("codigo", 40)
    val nome = varchar("nome", 180)
    val idMarca = reference("id_marca", MarcasTable)
    val idModelo = reference("id_modelo", ModelosTable)
    val descricao = varchar("descricao", 500).nullable()
    val tipo = varchar("tipo", 20)
    val idFilialCadastro = optReference("id_filial_cadastro", FiliaisTable)
    val status = varchar("status", 20).default("ativo")
}

object ProdutoFilialTable : LongIdTable("produto_filial") {
    val idProduto = reference("id_produto", ProdutosTable)
    val idFilial = reference("id_filial", FiliaisTable)
    val status = varchar("status", 20).default("ativo")

    init {
        uniqueIndex(idProduto, idFilial)
    }
}

object ProdutoMotosTable : LongIdTable("produto_moto") {
    val idProduto = reference("id_produto", ProdutosTable)
    val chassi = varchar("chassi", 40).nullable()
    val cor = varchar("cor", 40).nullable()
    val potenciaMotorW = integer("potencia_motor_w").nullable()
    val autonomiaKm = integer("autonomia_km").nullable()
    val velocidadeMaxKmh = integer("velocidade_max_kmh").nullable()
    val capacidadeBateriaAh = double("capacidade_bateria_ah").nullable()
    val voltagemBateria = integer("voltagem_bateria").nullable()
    val tempoCargaHoras = double("tempo_carga_horas").nullable()
    val pesoKg = double("peso_kg").nullable()
    val capacidadeCargaKg = integer("capacidade_carga_kg").nullable()
    val assentos = integer("assentos").nullable()
    val tipoFreio = varchar("tipo_freio", 60).nullable()
    val anoFabricacao = integer("ano_fabricacao")
    val anoModelo = integer("ano_modelo")

    init {
        uniqueIndex(idProduto)
    }
}

object ProdutoBicicletasTable : LongIdTable("produto_bicicleta") {
    val idProduto = reference("id_produto", ProdutosTable)
    val cor = varchar("cor", 40).nullable()
    val potenciaMotorW = integer("potencia_motor_w").nullable()
    val autonomiaKm = integer("autonomia_km").nullable()
    val capacidadeBateriaAh = double("capacidade_bateria_ah").nullable()
    val voltagemBateria = integer("voltagem_bateria").nullable()
    val tempoCargaHoras = double("tempo_carga_horas").nullable()
    val pesoKg = double("peso_kg").nullable()
    val aro = varchar("aro", 20).nullable()
    val tipoQuadro = varchar("tipo_quadro", 40).nullable()
    val numeroMarchas = integer("numero_marchas").nullable()
    val tipoFreio = varchar("tipo_freio", 60).nullable()
    val numeroSerieQuadro = varchar("numero_serie_quadro", 40).nullable()

    init {
        uniqueIndex(idProduto)
    }
}
