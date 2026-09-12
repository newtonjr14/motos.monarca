import type { Cidade, Cotacao, Moeda, Pessoa, PessoaEndereco } from "@/api";

const LOCALE = "pt-BR";

export function toTitleCase(valor: string): string {
  return valor
    .trim()
    .toLocaleLowerCase(LOCALE)
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toLocaleUpperCase(LOCALE) + p.slice(1))
    .join(" ");
}

export function toEmailLower(valor: string): string {
  return valor.trim().toLocaleLowerCase(LOCALE);
}

export function apenasDigitos(valor: string): string {
  return valor.replace(/\D/g, "");
}

/** CEP / código postal — letras e números, até 12 caracteres. */
export function normalizarCep(valor: string): string {
  return valor.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 12);
}

function apenasAlfanumerico(valor: string): string {
  return valor.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

function formatarCpf(valor: string): string {
  const d = apenasDigitos(valor).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function formatarCnpj(valor: string): string {
  const raw = apenasAlfanumerico(valor).slice(0, 14);
  if (raw.length <= 2) return raw;
  let out = raw.slice(0, 2);
  if (raw.length > 2) out += `.${raw.slice(2, 5)}`;
  if (raw.length > 5) out += `.${raw.slice(5, 8)}`;
  if (raw.length > 8) out += `/${raw.slice(8, 12)}`;
  if (raw.length > 12) out += `-${raw.slice(12, 14)}`;
  return out;
}

function formatarRuc(valor: string): string {
  const cleaned = valor.trim().replace(/[^\d-]/g, "");
  if (cleaned.includes("-")) return cleaned;
  const d = apenasDigitos(cleaned);
  if (d.length < 2) return d;
  return `${d.slice(0, -1)}-${d.slice(-1)}`;
}

function formatarCi(valor: string): string {
  const d = apenasDigitos(valor).slice(0, 10);
  if (d.length <= 3) return d;
  return d.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** Máscara visual — o banco continua recebendo o valor bruto (API normaliza). */
export function formatarDocumentoExibicao(codigo: string | null | undefined, numero: string): string {
  if (!numero) return "";
  switch (codigo?.toUpperCase()) {
    case "CPF":
      return formatarCpf(numero);
    case "CNPJ":
      return formatarCnpj(numero);
    case "RUC":
      return formatarRuc(numero);
    case "CI":
      return formatarCi(numero);
    default:
      return numero;
  }
}

export function formatarDocumentoEntrada(codigo: string | null | undefined, valor: string): string {
  return formatarDocumentoExibicao(codigo, valor);
}

export function placeholderDocumento(codigo: string | null | undefined): string {
  switch (codigo?.toUpperCase()) {
    case "CPF":
      return "000.000.000-00";
    case "CNPJ":
      return "00.000.000/0000-00";
    case "RUC":
      return "1234567-8";
    case "CI":
      return "1.234.567";
    default:
      return "Número";
  }
}

export type PaisTelefone = {
  codigo: string;
  iso: string;
  nome: string;
  mask: string;
  maxDigits: number;
};

export const PAISES_TELEFONE: PaisTelefone[] = [
  { codigo: "55", iso: "BR", nome: "Brasil", mask: "(##) #####-####", maxDigits: 11 },
  { codigo: "595", iso: "PY", nome: "Paraguai", mask: "### ### ###", maxDigits: 9 },
  { codigo: "54", iso: "AR", nome: "Argentina", mask: "## ####-####", maxDigits: 10 },
  { codigo: "591", iso: "BO", nome: "Bolívia", mask: "# ### ####", maxDigits: 8 },
  { codigo: "56", iso: "CL", nome: "Chile", mask: "# #### ####", maxDigits: 9 },
  { codigo: "57", iso: "CO", nome: "Colômbia", mask: "### ### ####", maxDigits: 10 },
  { codigo: "51", iso: "PE", nome: "Peru", mask: "### ### ###", maxDigits: 9 },
  { codigo: "598", iso: "UY", nome: "Uruguai", mask: "## ### ###", maxDigits: 8 },
  { codigo: "1", iso: "US", nome: "EUA / Canadá", mask: "(###) ###-####", maxDigits: 10 },
  { codigo: "351", iso: "PT", nome: "Portugal", mask: "### ### ###", maxDigits: 9 },
  { codigo: "34", iso: "ES", nome: "Espanha", mask: "### ## ## ##", maxDigits: 9 },
];

export function paisPorCodigo(codigo: string | null | undefined): PaisTelefone | undefined {
  if (!codigo) return undefined;
  return PAISES_TELEFONE.find((p) => p.codigo === codigo);
}

export function formatarTelefoneLocal(digitos: string, mask: string): string {
  let i = 0;
  let out = "";
  for (const ch of mask) {
    if (i >= digitos.length) break;
    if (ch === "#") out += digitos[i++];
    else out += ch;
  }
  if (i < digitos.length) out += digitos.slice(i);
  return out;
}

export function formatarTelefoneExibicao(ddi: string | null | undefined, numero: string | null | undefined): string {
  if (!ddi || !numero) return "—";
  const pais = paisPorCodigo(ddi);
  const local = pais ? formatarTelefoneLocal(numero, pais.mask) : numero;
  return `+${ddi} ${local}`;
}

export const PAGE_SIZE = 10;

export function formatPyg(valor: number): string {
  return Math.round(valor).toLocaleString("es-PY");
}

export function formatMoeda(valor: number, moeda: string): string {
  if (moeda === "usd" || moeda === "brl") {
    const n = valor.toLocaleString("es-PY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return moeda === "brl" ? `R$ ${n}` : `US$ ${n}`;
  }
  return `Gs. ${formatPyg(valor)}`;
}

export const MOEDAS: Moeda[] = ["pyg", "usd", "brl"];

export function moedaOperacaoDe(valor: string | null | undefined): Moeda {
  return valor === "pyg" || valor === "brl" || valor === "usd" ? valor : "usd";
}

export function paraPyg(preco: number, moeda: string, cotacao: Cotacao | null): number {
  if (moeda === "pyg") return Math.round(preco);
  if (!cotacao) return 0;
  if (moeda === "usd") return Math.round(preco * cotacao.usdPyg);
  if (moeda === "brl") return Math.round(preco * cotacao.brlPyg);
  return Math.round(preco);
}

export function dePyg(pyg: number, moeda: Moeda, cotacao: Cotacao | null): number {
  if (!cotacao || moeda === "pyg") return pyg;
  if (moeda === "usd") return pyg / cotacao.usdPyg;
  return pyg / cotacao.brlPyg;
}

export function converterMoeda(valor: number, de: Moeda, para: Moeda, cotacao: Cotacao | null): number {
  if (!Number.isFinite(valor)) return 0;
  if (de === para) return valor;
  const pyg = paraPyg(valor, de, cotacao);
  if (para === "pyg") return pyg;
  return dePyg(pyg, para, cotacao);
}

export function slicePage<T>(itens: T[], page: number) {
  const totalPages = Math.max(1, Math.ceil(itens.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  return {
    pageSafe,
    total: itens.length,
    slice: itens.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE),
  };
}

export function cidadePorId(cidades: Cidade[], id: number | null): Cidade | undefined {
  if (id == null) return undefined;
  return cidades.find((x) => x.id === id);
}

export function rotuloCidade(c: Cidade, curto = false): string {
  const divisao = c.divisaoSigla ? c.divisaoSigla.toUpperCase() : c.divisaoNome;
  const nucleo = c.tipo === "distrito" && c.municipioNome
    ? `${c.nome} — ${c.municipioNome}`
    : c.nome;
  if (curto) return [nucleo, divisao, c.paisNome].filter(Boolean).join(" - ");
  return `${nucleo} · ${divisao} · ${c.paisNome}`;
}

export function formatarCidade(cidades: Cidade[], id: number | null, curto = false): string {
  const c = cidadePorId(cidades, id);
  if (!c) return "—";
  return rotuloCidade(c, curto);
}

export function enderecoPrincipal(p: Pessoa): PessoaEndereco | undefined {
  const ativos = (p.enderecos ?? []).filter((e) => e.status !== "deletado");
  return ativos.find((e) => e.principal) ?? ativos[0];
}

/** Data de calendário `yyyy-mm-dd` → `dd/mm/aaaa` (Brasil e Paraguai). */
export function formatarDataIso(valor: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(valor.trim());
  if (!m) return valor;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

export function formatarDataEpoch(ms: number, timeZone = "America/Asuncion"): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(ms));
}

export function formatarDataHoraEpoch(ms: number, timeZone = "America/Asuncion"): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ms));
}

export function formatarEndereco(p: Pessoa, cidades: Cidade[]): string | null {
  const e = enderecoPrincipal(p);
  if (!e) return null;
  const logradouro = [e.tipoLogradouro, e.logradouro].filter(Boolean).join(" ");
  const linha1 = [logradouro, e.numero].filter(Boolean).join(", ");
  const cidade = formatarCidade(cidades, e.idCidade);
  const parts = [
    linha1 || null,
    e.bairro?.trim() || null,
    e.cep?.trim() ? `CEP ${e.cep.trim()}` : null,
    e.complemento?.trim() || null,
    cidade !== "—" ? cidade : null,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

export const CHASSI_MAXIMO = 500;

export function normalizarChassi(valor: string): string {
  return valor.trim().toUpperCase().replace(/ /g, "");
}

export type ChassiExpansaoErro = "CHASSI_INTERVALO_INVALIDO" | "CHASSI_INTERVALO_GRANDE";

export type ChassiExpansao =
  | { ok: true; numeros: string[] }
  | { ok: false; codigo: ChassiExpansaoErro };

function expandirIntervaloChassi(texto: string): string[] {
  const i = texto.indexOf("~");
  if (i < 0) {
    const unico = normalizarChassi(texto);
    return unico ? [unico] : [];
  }
  const inicio = normalizarChassi(texto.slice(0, i));
  const fim = normalizarChassi(texto.slice(i + 1));
  if (!inicio || !fim) throw new Error("CHASSI_INTERVALO_INVALIDO");
  if (inicio === fim) return [inicio];
  if (inicio.length !== fim.length) throw new Error("CHASSI_INTERVALO_INVALIDO");
  let p = 0;
  while (p < inicio.length && inicio[p] === fim[p]) p += 1;
  const prefixo = inicio.slice(0, p);
  const sufixoIni = inicio.slice(p);
  const sufixoFim = fim.slice(p);
  if (!sufixoIni || !/^\d+$/.test(sufixoIni) || !/^\d+$/.test(sufixoFim)) {
    throw new Error("CHASSI_INTERVALO_INVALIDO");
  }
  const de = Number(sufixoIni);
  const ate = Number(sufixoFim);
  if (ate < de) throw new Error("CHASSI_INTERVALO_INVALIDO");
  const qtd = ate - de + 1;
  if (qtd > CHASSI_MAXIMO) throw new Error("CHASSI_INTERVALO_GRANDE");
  const largura = sufixoIni.length;
  const saida: string[] = [];
  for (let n = de; n <= ate; n += 1) {
    saida.push(prefixo + String(n).padStart(largura, "0"));
  }
  return saida;
}

export function expandirNumerosChassi(texto: string): ChassiExpansao {
  try {
    const saida: string[] = [];
    for (const item of texto.split(/[\n\r,;]/)) {
      const bruto = item.trim();
      if (!bruto) continue;
      if (bruto.includes("~")) saida.push(...expandirIntervaloChassi(bruto));
      else {
        const n = normalizarChassi(bruto);
        if (n) saida.push(n);
      }
    }
    return { ok: true, numeros: saida };
  } catch (e) {
    const codigo = e instanceof Error && e.message === "CHASSI_INTERVALO_GRANDE"
      ? "CHASSI_INTERVALO_GRANDE"
      : "CHASSI_INTERVALO_INVALIDO";
    return { ok: false, codigo };
  }
}
