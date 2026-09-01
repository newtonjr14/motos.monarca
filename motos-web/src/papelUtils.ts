import type { Pessoa } from "@/api";

export function pessoaParaAtualizacao(p: Pessoa) {
  return {
    nomeRazaoSocial: p.nomeRazaoSocial,
    tipoPessoa: p.tipoPessoa,
    ddi: p.ddi,
    telefone: p.telefone,
    email: p.email,
    tipoLogradouro: p.tipoLogradouro,
    logradouro: p.logradouro,
    numero: p.numero,
    bairro: p.bairro,
    cep: p.cep,
    complemento: p.complemento,
    idCidade: p.idCidade,
    status: "ativo" as const,
    documentos: p.documentos.map((d) => ({
      idPais: d.idPais,
      idTipoDocumento: d.idTipoDocumento,
      numero: d.numero,
    })),
  };
}
