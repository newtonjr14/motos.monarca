import type { Pessoa } from "@/api";

export function pessoaParaAtualizacao(p: Pessoa) {
  return {
    nomeRazaoSocial: p.nomeRazaoSocial,
    tipoPessoa: p.tipoPessoa,
    ddi: p.ddi,
    telefone: p.telefone,
    email: p.email,
    enderecos: (p.enderecos ?? [])
      .filter((e) => e.status !== "deletado")
      .map((e) => ({
        tipo: e.tipo,
        principal: e.principal,
        tipoLogradouro: e.tipoLogradouro,
        logradouro: e.logradouro,
        numero: e.numero,
        bairro: e.bairro,
        cep: e.cep,
        complemento: e.complemento,
        idCidade: e.idCidade,
      })),
    status: "ativo" as const,
    documentos: p.documentos.map((d) => ({
      idPais: d.idPais,
      idTipoDocumento: d.idTipoDocumento,
      numero: d.numero,
    })),
  };
}
