package com.monarca.empresa.domain

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/**
 * Motor fiscal da **filial** (emissão de venda / factura).
 *
 * Hoje só [PY_IVA]. País da filial continua vindo da cidade.
 *
 * --- Brasil (quando e se surgir) ---
 * 1. Nova **empresa** com CNPJ — não reutilizar o RUC paraguaio nem emitir NF-e
 *    como “filial” da empresa PY. No fisco são duas pessoas jurídicas.
 * 2. Novos valores neste enum, só válidos se a cidade for BR:
 *    - `br_pendente` — cadastro ok, bloquear emissão até existir módulo NF-e
 *    - `br_simples` / `br_presumido` / `br_real` — eleição da PJ (Receita),
 *      não misturar no mesmo combo com `py_iva`
 * 3. Form: filtrar opções pelo país da cidade; no BR esconder timbrado /
 *    estabelecimento / ponto de expedição; no PY esconder IE/IM.
 * 4. API: rejeitar `py_iva` com cidade BR e rejeitar `br_*` com cidade PY.
 * 5. Alíquota (IVA 0/5/10 ou CST/NCM) fica no **produto**; este campo só
 *    escolhe o motor. Não gravar Simples na empresa paraguaia.
 */
@Serializable
enum class PerfilFiscal {
    @SerialName("py_iva")
    PY_IVA,
}
