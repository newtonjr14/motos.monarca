import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ListToolbar, TableHeadRow, TablePagination, Td, useListSort } from "@/components/crud/ListUi";
import TituloFicha from "@/components/TituloFicha";
import VendaFicha from "@/components/VendaFicha";
import { useCrudReset } from "@/hooks/useCrudReset";
import { useI18n } from "@/i18n";
import type { TranslationKey } from "@/i18n";
import { tf } from "@/i18n/format";
import { mensagemErroApi } from "@/i18n/apiMessages";
import { useAuth } from "@/auth/AuthContext";
import { useFilial, useFilialId } from "@/auth/FilialContext";
import { useCotacaoHoje } from "@/components/CotacaoBanner";
import RelatorioFolha, { baixarPlanilha, type FolhaRelatorio } from "@/components/RelatorioFolha";
import {
  Permissao,
  buscarTituloPagar,
  buscarTituloReceber,
  listarBaixasPagar,
  listarBaixasReceber,
  listarCaixas,
  listarEstoqueProdutos,
  listarFinalizadores,
  listarMovimentosEstoque,
  listarParcelasPagar,
  listarParcelasReceber,
  listarVendas,
  type BaixaRelatorio,
  type Caixa,
  type EstoqueMovimento,
  type EstoqueProduto,
  type Finalizador,
  type RelatorioParcela,
  type TituloPagar,
  type TituloReceber,
  type Venda,
} from "@/api";
import { converterMoeda, formatMoeda, formatPyg, formatarDataHoraEpoch, formatarDataIso, PAGE_SIZE, partesMovimento, slicePage } from "@/format";

const v = (name: string) => `var(${name})`;
const border1 = () => `1px solid ${v("--border")}`;

type RelatorioId = "vendas" | "receber" | "pagar" | "estoque";
type Leitura = "posicao" | "baixas" | "movimentos";
type FiltroParcelaRelatorio = "abertas" | "vencidas" | "parciais" | "pagas" | "todas";
type Agrupamento = "nenhum" | "pessoa" | "vencimento";
type CampoPeriodo = "todas" | "emissao" | "vencimento";
type CampoBaixa = "todas" | "movimento";
type PeriodoVendas = "todas" | "fechamento";

function passaParcela(e: { status: string; vencimento: string }, filtro: FiltroParcelaRelatorio): boolean {
  if (filtro === "todas") return true;
  if (filtro === "pagas") return e.status === "paga";
  if (filtro === "parciais") return e.status === "parcial";
  if (filtro === "vencidas") {
    const atraso = diasAtraso(e.vencimento);
    return (e.status === "aberta" || e.status === "parcial") && (atraso ?? 0) > 0;
  }
  return e.status === "aberta" || e.status === "parcial";
}

function isoNoFuso(data = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Asuncion",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(data);
}

function inicioMes(): string {
  return `${isoNoFuso().slice(0, 8)}01`;
}

function fimMes(): string {
  const iso = isoNoFuso();
  const [ano, mes] = iso.split("-").map(Number);
  const ultimo = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  return `${iso.slice(0, 8)}${String(ultimo).padStart(2, "0")}`;
}

function datasValidas(de: string, ate: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(de) && /^\d{4}-\d{2}-\d{2}$/.test(ate) && de <= ate;
}

function passaPeriodo(e: { vencimento: string; criadoEm?: number }, campo: CampoPeriodo, de: string, ate: string): boolean {
  if (campo === "todas") return true;
  if (!datasValidas(de, ate)) return false;
  const iso = campo === "vencimento" ? e.vencimento : (e.criadoEm ? isoNoFuso(new Date(e.criadoEm)) : "");
  return iso.length > 0 && iso >= de && iso <= ate;
}

function noPeriodo(ms: number, de: string, ate: string): boolean {
  const iso = isoNoFuso(new Date(ms));
  if (de && iso < de) return false;
  if (ate && iso > ate) return false;
  return true;
}

function diasAtraso(vencimento: string | null | undefined): number | null {
  if (!vencimento) return null;
  const hoje = isoNoFuso();
  if (vencimento >= hoje) return 0;
  const a = new Date(`${vencimento}T12:00:00`).getTime();
  const b = new Date(`${hoje}T12:00:00`).getTime();
  return Math.round((b - a) / 86_400_000);
}

function pygNaMoeda(pyg: number, usdPyg: number, brlPyg: number, moeda: "pyg" | "usd" | "brl"): number {
  if (moeda === "pyg") return pyg;
  const taxa = moeda === "usd" ? usdPyg : brlPyg;
  if (!taxa) return 0;
  return pyg / taxa;
}

function somaCampo(
  itens: RelatorioParcela[],
  campo: "saldoPyg" | "recebidoPyg" | "acrescimoPyg" | "descontoPyg",
  moeda: "pyg" | "usd" | "brl",
): number {
  return itens.reduce((s, e) => s + pygNaMoeda(e[campo], e.usdPyg, e.brlPyg, moeda), 0);
}

const LINHAS_TOTAL: { moeda: "pyg" | "usd" | "brl"; rotulo: string }[] = [
  { moeda: "pyg", rotulo: "Gs." },
  { moeda: "usd", rotulo: "US$" },
  { moeda: "brl", rotulo: "R$" },
];

const CAMPOS_TOTAL = ["saldoPyg", "recebidoPyg", "acrescimoPyg", "descontoPyg"] as const;

function numeroMoeda(valor: number, moeda: "pyg" | "usd" | "brl"): string {
  if (moeda === "pyg") return formatPyg(valor);
  return valor.toLocaleString("es-PY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function celulasTotal(grupo: RelatorioParcela[], moeda: "pyg" | "usd" | "brl", simbolo: string, rotulo: string): string[] {
  return [
    "", "", "",
    rotulo,
    "", "", "",
    simbolo,
    numeroMoeda(somaCampo(grupo, "saldoPyg", moeda), moeda),
    numeroMoeda(somaCampo(grupo, "recebidoPyg", moeda), moeda),
    numeroMoeda(somaCampo(grupo, "acrescimoPyg", moeda), moeda),
    numeroMoeda(somaCampo(grupo, "descontoPyg", moeda), moeda),
    "",
  ];
}

function cotacaoParcela(e: { usdPyg?: number; brlPyg?: number }): string {
  if (!e.usdPyg && !e.brlPyg) return "—";
  return `USD ${e.usdPyg ?? "—"} · BRL ${e.brlPyg ?? "—"}`;
}

function statusParcelaKey(status: string): TranslationKey {
  if (status === "paga") return "titulo.parcela.paga";
  if (status === "parcial") return "titulo.parcela.parcial";
  if (status === "cancelada") return "titulo.parcela.cancelada";
  return "titulo.parcela.aberta";
}

function tipoKey(tipo: string): TranslationKey {
  if (tipo === "venda") return "relatorio.tipo.venda";
  if (tipo === "entrada") return "relatorio.tipo.entrada";
  return "relatorio.tipo.ajuste";
}

function Segmentos<T extends string>({ value, onChange, opcoes, label }: {
  value: T;
  onChange: (v: T) => void;
  opcoes: { id: T; label: TranslationKey }[];
  label: string;
}) {
  const { t } = useI18n();
  return (
    <div className="status-filter" role="group" aria-label={label}>
      {opcoes.map((o) => (
        <button
          key={o.id}
          type="button"
          className={`status-filter-btn${value === o.id ? " is-on" : ""}`}
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
        >
          {t(o.label)}
        </button>
      ))}
    </div>
  );
}

function MenuExportar({ disabled, onPdf, onExcel }: {
  disabled: boolean;
  onPdf: () => void;
  onExcel: () => void;
}) {
  const { t } = useI18n();
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    function fecha(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setAberto(false);
    }
    function tecla(e: KeyboardEvent) {
      if (e.key === "Escape") setAberto(false);
    }
    document.addEventListener("mousedown", fecha);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("mousedown", fecha);
      document.removeEventListener("keydown", tecla);
    };
  }, [aberto]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="btn-ghost px-3 py-1.5 text-xs"
        disabled={disabled}
        aria-expanded={aberto}
        aria-haspopup="menu"
        onClick={() => setAberto((v) => !v)}
      >
        {t("relatorio.exportar")}
      </button>
      {aberto && !disabled && (
        <div
          className="absolute right-0 z-20 mt-1 min-w-[9rem] rounded-md py-1 shadow-lg"
          style={{ background: v("--card"), border: border1() }}
          role="menu"
        >
          <button type="button" className="block w-full px-3 py-1.5 text-left text-xs" role="menuitem" style={{ color: v("--text") }} onClick={() => { setAberto(false); onPdf(); }}>
            {t("relatorio.pdf")}
          </button>
          <button type="button" className="block w-full px-3 py-1.5 text-left text-xs" role="menuitem" style={{ color: v("--text") }} onClick={() => { setAberto(false); onExcel(); }}>
            {t("relatorio.excel")}
          </button>
        </div>
      )}
    </div>
  );
}

const tituloRelatorio: Record<RelatorioId, TranslationKey> = {
  vendas: "nav.relatorioVendas",
  receber: "nav.relatorioReceber",
  pagar: "nav.relatorioPagar",
  estoque: "nav.relatorioEstoque",
};

export default function RelatoriosPage({ navReset, relatorio }: { navReset: number; relatorio: RelatorioId }) {
  const { t, locale } = useI18n();
  const { cotacao } = useCotacaoHoje();
  const { hasPermission } = useAuth();
  const { filial } = useFilial();
  const idFilial = useFilialId();
  const podeFin = hasPermission(Permissao.FINANCEIRO_OPERAR);
  const [leitura, setLeitura] = useState<Leitura>("posicao");
  const [filtroParcela, setFiltroParcela] = useState<FiltroParcelaRelatorio>("abertas");
  const [agrupamento, setAgrupamento] = useState<Agrupamento>("nenhum");
  const [campoPeriodo, setCampoPeriodo] = useState<CampoPeriodo>("todas");
  const [periodoVendas, setPeriodoVendas] = useState<PeriodoVendas>("fechamento");
  const [campoBaixa, setCampoBaixa] = useState<CampoBaixa>("movimento");
  const [search, setSearch] = useState("");
  const [de, setDe] = useState(inicioMes);
  const [ate, setAte] = useState(fimMes);
  const [comSaldo, setComSaldo] = useState(true);
  const [page, setPage] = useState(1);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const [folha, setFolha] = useState<FolhaRelatorio | null>(null);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [receber, setReceber] = useState<RelatorioParcela[]>([]);
  const [pagar, setPagar] = useState<RelatorioParcela[]>([]);
  const [baixasReceber, setBaixasReceber] = useState<BaixaRelatorio[]>([]);
  const [baixasPagar, setBaixasPagar] = useState<BaixaRelatorio[]>([]);
  const [saldos, setSaldos] = useState<EstoqueProduto[]>([]);
  const [movimentos, setMovimentos] = useState<EstoqueMovimento[]>([]);
  const [finalizadores, setFinalizadores] = useState<Finalizador[]>([]);
  const [caixas, setCaixas] = useState<Caixa[]>([]);
  const [vendaId, setVendaId] = useState<number | null>(null);
  const [fichaId, setFichaId] = useState<number | null>(null);
  const [titulo, setTitulo] = useState<TituloReceber | TituloPagar | null>(null);

  const resetLista = useCallback(() => {
    setVendaId(null);
    setFichaId(null);
    setTitulo(null);
  }, []);
  useCrudReset(navReset, resetLista);

  const leituraAtiva: Leitura = relatorio === "estoque"
    ? (leitura === "movimentos" ? "movimentos" : "posicao")
    : relatorio === "receber" || relatorio === "pagar"
      ? (leitura === "baixas" ? "baixas" : "posicao")
      : "posicao";

  useEffect(() => {
    let ativo = true;
    setErro(null);
    setCarregando(true);
    const falha = (e: unknown) => { if (ativo) setErro(mensagemErroApi(e, t, "common.error.loadFailed")); };
    const fim = () => { if (ativo) setCarregando(false); };
    if (relatorio === "vendas") {
      listarVendas(idFilial).then((r) => { if (ativo) setVendas(r); }).catch(falha).finally(fim);
    } else if (relatorio === "receber" && leituraAtiva === "posicao") {
      listarParcelasReceber(idFilial).then((r) => { if (ativo) setReceber(r); }).catch(falha).finally(fim);
    } else if (relatorio === "receber") {
      listarBaixasReceber(idFilial).then((r) => { if (ativo) setBaixasReceber(r); }).catch(falha).finally(fim);
    } else if (relatorio === "pagar" && leituraAtiva === "posicao") {
      listarParcelasPagar(idFilial).then((r) => { if (ativo) setPagar(r); }).catch(falha).finally(fim);
    } else if (relatorio === "pagar") {
      listarBaixasPagar(idFilial).then((r) => { if (ativo) setBaixasPagar(r); }).catch(falha).finally(fim);
    } else if (leituraAtiva === "movimentos") {
      listarMovimentosEstoque(idFilial).then((r) => { if (ativo) setMovimentos(r); }).catch(falha).finally(fim);
    } else {
      listarEstoqueProdutos(undefined, idFilial).then((r) => { if (ativo) setSaldos(r); }).catch(falha).finally(fim);
    }
    return () => { ativo = false; };
  }, [idFilial, relatorio, leituraAtiva, t]);

  useEffect(() => {
    if (!podeFin) return;
    let ativo = true;
    Promise.all([listarFinalizadores(), listarCaixas(idFilial)])
      .then(([fins, cxs]) => {
        if (!ativo) return;
        setFinalizadores(fins.filter((f) => !f.geraContasReceber && !f.geraContasPagar && f.status === "ativo"));
        setCaixas(cxs);
      })
      .catch(() => { /* a ficha avisa se faltar caixa */ });
    return () => { ativo = false; };
  }, [idFilial, podeFin]);

  const q = search.trim().toLowerCase();
  const vendasFiltradas = useMemo(() => vendas.filter((e) =>
    e.status === "finalizada" &&
    (periodoVendas === "todas" || (datasValidas(de, ate) && noPeriodo(e.finalizadaEm ?? e.criadoEm, de, ate))) &&
    `${e.id} ${e.clienteNome} ${e.vendedorNome}`.toLowerCase().includes(q),
  ), [vendas, periodoVendas, de, ate, q]);
  const receberAberto = useMemo(() => receber.filter((e) =>
    passaParcela(e, filtroParcela) &&
    passaPeriodo(e, campoPeriodo, de, ate) &&
    `${e.pessoaNome} ${e.idDocumento ?? ""} ${e.numero} ${e.id}`.toLowerCase().includes(q),
  ), [receber, filtroParcela, campoPeriodo, de, ate, q]);
  const pagarAberto = useMemo(() => pagar.filter((e) =>
    passaParcela(e, filtroParcela) &&
    passaPeriodo(e, campoPeriodo, de, ate) &&
    `${e.pessoaNome} ${e.numero} ${e.id}`.toLowerCase().includes(q),
  ), [pagar, filtroParcela, campoPeriodo, de, ate, q]);
  const baixasR = useMemo(() => baixasReceber.filter((e) =>
    (campoBaixa === "todas" || (datasValidas(de, ate) && noPeriodo(e.criadoEm, de, ate))) &&
    `${e.pessoaNome} ${e.finalizadorNome}`.toLowerCase().includes(q),
  ), [baixasReceber, campoBaixa, de, ate, q]);
  const baixasP = useMemo(() => baixasPagar.filter((e) =>
    (campoBaixa === "todas" || (datasValidas(de, ate) && noPeriodo(e.criadoEm, de, ate))) &&
    `${e.pessoaNome} ${e.finalizadorNome}`.toLowerCase().includes(q),
  ), [baixasPagar, campoBaixa, de, ate, q]);
  const saldosFiltrados = useMemo(() => saldos.filter((e) =>
    (!comSaldo || e.quantidadeDisponivel > 0) &&
    `${e.produtoCodigo} ${e.produtoNome} ${e.estoqueNome}`.toLowerCase().includes(q),
  ), [saldos, comSaldo, q]);
  const movimentosFiltrados = useMemo(() => movimentos.filter((e) =>
    noPeriodo(e.criadoEm, de, ate) &&
    `${e.produtoCodigo} ${e.produtoNome} ${e.estoqueNome} ${e.observacao ?? ""}`.toLowerCase().includes(q),
  ), [movimentos, de, ate, q]);

  const sortVendas = useListSort(vendasFiltradas, (e, k) => {
    if (k === "data") return e.finalizadaEm ?? e.criadoEm;
    if (k === "cliente") return e.clienteNome;
    if (k === "total") return e.totalPyg;
    if (k === "vendedor") return e.vendedorNome;
    return e.id;
  }, "data", "desc");
  const sortReceber = useListSort(receberAberto, (e, k) => {
    if (k === "pessoa") return e.pessoaNome;
    if (k === "venc") return e.vencimento;
    if (k === "atraso") return diasAtraso(e.vencimento) ?? 0;
    if (k === "saldo") return e.saldoPyg;
    if (k === "parc") return e.numero;
    return e.id;
  }, "venc", "asc");
  const sortPagar = useListSort(pagarAberto, (e, k) => {
    if (k === "pessoa") return e.pessoaNome;
    if (k === "venc") return e.vencimento;
    if (k === "atraso") return diasAtraso(e.vencimento) ?? 0;
    if (k === "saldo") return e.saldoPyg;
    if (k === "parc") return e.numero;
    return e.id;
  }, "venc", "asc");
  const sortBaixasR = useListSort(baixasR, (e, k) => {
    if (k === "data") return e.criadoEm;
    if (k === "pessoa") return e.pessoaNome;
    if (k === "valor") return e.valorPyg;
    return e.finalizadorNome;
  }, "data", "desc");
  const sortBaixasP = useListSort(baixasP, (e, k) => {
    if (k === "data") return e.criadoEm;
    if (k === "pessoa") return e.pessoaNome;
    if (k === "valor") return e.valorPyg;
    return e.finalizadorNome;
  }, "data", "desc");
  const sortSaldos = useListSort(saldosFiltrados, (e, k) => {
    if (k === "codigo") return e.produtoCodigo;
    if (k === "nome") return e.produtoNome;
    if (k === "estoque") return e.estoqueNome;
    if (k === "qtd") return e.quantidade;
    if (k === "disp") return e.quantidadeDisponivel;
    return e.quantidadeReservada;
  }, "nome", "asc");
  const sortMov = useListSort(movimentosFiltrados, (e, k) => {
    if (k === "data") return e.criadoEm;
    if (k === "produto") return e.produtoNome;
    if (k === "estoque") return e.estoqueNome;
    if (k === "anterior") return e.saldoDepois - e.quantidade;
    if (k === "entrada") return e.quantidade > 0 ? e.quantidade : 0;
    if (k === "saida") return e.quantidade < 0 ? -e.quantidade : 0;
    if (k === "estoque") return e.saldoDepois;
    return e.tipo;
  }, "data", "desc");

  useEffect(() => { setPage(1); }, [search, de, ate, comSaldo, filtroParcela, campoPeriodo, campoBaixa, periodoVendas, agrupamento, relatorio, leituraAtiva, sortVendas.sortKey, sortVendas.sortDir]);

  const dataHora = (ms: number) => formatarDataHoraEpoch(ms, locale === "es" ? "es-PY" : "pt-BR");

  const vendaIndex = vendaId != null ? sortVendas.items.findIndex((e) => e.id === vendaId) : -1;
  const vendaFicha = vendaIndex >= 0 ? sortVendas.items[vendaIndex] : null;
  const parcelasOrdenadas = relatorio === "pagar" ? sortPagar.items : sortReceber.items;
  const idsTitulo = parcelasOrdenadas.reduce<number[]>((acc, e) => {
    if (!acc.includes(e.idTitulo)) acc.push(e.idTitulo);
    return acc;
  }, []);
  const tituloIndex = fichaId != null ? idsTitulo.indexOf(fichaId) : -1;

  useEffect(() => {
    if (fichaId == null || (relatorio !== "receber" && relatorio !== "pagar") || leituraAtiva !== "posicao") {
      setTitulo(null);
      return;
    }
    let ativo = true;
    const pedido = relatorio === "pagar" ? buscarTituloPagar(fichaId) : buscarTituloReceber(fichaId);
    pedido
      .then((item) => { if (ativo) setTitulo(item); })
      .catch((e) => { if (ativo) setErro(mensagemErroApi(e, t, "common.error.loadFailed")); });
    return () => { ativo = false; };
  }, [fichaId, relatorio, leituraAtiva, t]);

  const totalPyg = relatorio === "vendas"
    ? sortVendas.items.reduce((s, e) => s + e.totalPyg, 0)
    : relatorio === "receber" && leituraAtiva === "posicao"
      ? sortReceber.items.reduce((s, e) => s + e.saldoPyg, 0)
      : relatorio === "pagar" && leituraAtiva === "posicao"
        ? sortPagar.items.reduce((s, e) => s + e.saldoPyg, 0)
        : relatorio === "receber"
          ? sortBaixasR.items.reduce((s, e) => s + e.valorPyg, 0)
          : relatorio === "pagar"
            ? sortBaixasP.items.reduce((s, e) => s + e.valorPyg, 0)
            : leituraAtiva === "movimentos"
              ? sortMov.items.reduce((s, e) => s + e.quantidade, 0)
              : sortSaldos.items.reduce((s, e) => s + e.quantidadeDisponivel, 0);

  const contagem = relatorio === "vendas" ? sortVendas.items.length
    : relatorio === "receber" && leituraAtiva === "posicao" ? sortReceber.items.length
      : relatorio === "pagar" && leituraAtiva === "posicao" ? sortPagar.items.length
        : relatorio === "receber" ? sortBaixasR.items.length
          : relatorio === "pagar" ? sortBaixasP.items.length
            : leituraAtiva === "movimentos" ? sortMov.items.length
              : sortSaldos.items.length;

  const descPyg = relatorio === "receber" ? sortBaixasR.items.reduce((s, e) => s + e.descontoPyg, 0)
    : sortBaixasP.items.reduce((s, e) => s + e.descontoPyg, 0);
  const acrPyg = relatorio === "receber" ? sortBaixasR.items.reduce((s, e) => s + e.acrescimoPyg, 0)
    : sortBaixasP.items.reduce((s, e) => s + e.acrescimoPyg, 0);

  const atrasoTxt = (vencimento: string) => {
    const atraso = diasAtraso(vencimento);
    return atraso && atraso > 0 ? tf(t, "relatorio.dias", { n: String(atraso) }) : "—";
  };

  function montarFolha(): FolhaRelatorio {
    const titulo = t(tituloRelatorio[relatorio]);
    const empresa = filial?.nome ?? "";
    const emitidoEm = dataHora(Date.now());
    const situacao = filtroParcela === "pagas" ? t("titulo.filtro.pagas")
      : filtroParcela === "parciais" ? t("titulo.filtro.parciais")
        : filtroParcela === "vencidas" ? t("relatorio.vencidas")
          : filtroParcela === "todas" ? t("filter.status.all")
            : t("relatorio.somenteAbertos");
    const rotuloBaixa = relatorio === "pagar" ? t("relatorio.periodo.pagamento") : t("relatorio.periodo.recebimento");
    const periodoParcelas = (relatorio === "receber" || relatorio === "pagar") && leituraAtiva === "posicao" && campoPeriodo !== "todas" && datasValidas(de, ate);
    const periodoBaixas = (relatorio === "receber" || relatorio === "pagar") && leituraAtiva === "baixas" && campoBaixa !== "todas" && datasValidas(de, ate);
    const rotuloCampo = campoPeriodo === "emissao" ? t("relatorio.periodo.emissao") : t("relatorio.periodo.vencimento");
    const faixa = `${formatarDataIso(de)} – ${formatarDataIso(ate)}`;
    const periodo = relatorio === "vendas"
      ? (periodoVendas === "fechamento" && datasValidas(de, ate)
        ? `${t("relatorio.fechamento")} ${faixa}`
        : t("relatorio.periodo.todas"))
      : leituraAtiva === "movimentos"
      ? `${t("relatorio.de")} ${formatarDataIso(de)} ${t("relatorio.ate")} ${formatarDataIso(ate)}`
      : periodoParcelas
        ? `${situacao} · ${rotuloCampo} ${faixa}`
        : periodoBaixas
          ? `${rotuloBaixa} ${faixa}`
          : leituraAtiva === "baixas"
            ? t("relatorio.periodo.todas")
            : situacao;
    const filtro = `${empresa} · ${periodo}`;
    const arquivoBase = relatorio === "estoque" && leituraAtiva === "movimentos" ? "movimentos-estoque"
      : relatorio === "estoque" ? "posicao-estoque"
        : relatorio === "vendas" ? "vendas"
          : relatorio === "receber" && leituraAtiva === "baixas" ? "baixas-receber"
            : relatorio === "pagar" && leituraAtiva === "baixas" ? "baixas-pagar"
              : relatorio === "receber" ? "contas-a-receber"
                : "contas-a-pagar";
    const vazio = (n: number) => Array(n).fill("");

    if ((relatorio === "receber" || relatorio === "pagar") && leituraAtiva === "posicao") {
      const itens = [...parcelasOrdenadas].sort((a, b) => a.vencimento.localeCompare(b.vencimento) || a.pessoaNome.localeCompare(b.pessoaNome));
      const colunas = [
        t("col.id"), t("titulo.vencimento"), t("relatorio.atraso"),
        t(relatorio === "receber" ? "venda.client" : "nav.fornecedores"),
        t(relatorio === "receber" ? "relatorio.venda" : "relatorio.documento"), t("relatorio.parcela"), t("relatorio.nominal"), t("relatorio.cotacao"),
        t("relatorio.saldo"), t("relatorio.recebido"), t("titulo.acrescimo"), t("titulo.desconto"),
        t("relatorio.situacao"),
      ];
      const pyg = (n: number) => `Gs. ${formatPyg(n)}`;
      const linhaDe = (e: RelatorioParcela) => [
        String(e.id), formatarDataIso(e.vencimento), atrasoTxt(e.vencimento), e.pessoaNome,
        e.idDocumento ? String(e.idDocumento) : "—", String(e.numero), formatMoeda(e.valor, e.moeda), cotacaoParcela(e),
        pyg(e.saldoPyg), pyg(e.recebidoPyg), pyg(e.acrescimoPyg), pyg(e.descontoPyg),
        t(statusParcelaKey(e.status)),
      ];
      const linhas: string[][] = [];
      const destaques: number[] = [];
      const empurrarTotal = (rotulo: string, grupo: RelatorioParcela[]) => {
        LINHAS_TOTAL.forEach(({ moeda, rotulo: simbolo }, i) => {
          linhas.push(celulasTotal(grupo, moeda, simbolo, i === 0 ? rotulo : ""));
          destaques.push(linhas.length - 1);
        });
      };
      if (agrupamento === "nenhum") {
        for (const e of itens) linhas.push(linhaDe(e));
      } else {
        const ordenados = agrupamento === "pessoa"
          ? [...itens].sort((a, b) => a.pessoaNome.localeCompare(b.pessoaNome) || a.vencimento.localeCompare(b.vencimento))
          : itens;
        const grupos = new Map<string, RelatorioParcela[]>();
        for (const e of ordenados) {
          const chave = agrupamento === "pessoa" ? e.pessoaNome : e.vencimento;
          const lista = grupos.get(chave) ?? [];
          lista.push(e);
          grupos.set(chave, lista);
        }
        for (const [chave, grupo] of grupos) {
          for (const e of grupo) linhas.push(linhaDe(e));
          const rotulo = agrupamento === "pessoa"
            ? `${t("relatorio.total")} ${chave}`
            : `${t("relatorio.totalDia")} ${formatarDataIso(chave)}`;
          empurrarTotal(rotulo, grupo);
        }
      }
      const rotuloGeral = empresa ? `${t("relatorio.total")} ${empresa}` : t("relatorio.total");
      const rodapes = [
        ...LINHAS_TOTAL.map(({ moeda, rotulo }, i) => ({
          rotulo: i === 0 ? rotuloGeral : "",
          celulas: celulasTotal(itens, moeda, rotulo, ""),
        })),
        { rotulo: tf(t, "relatorio.registros", { n: String(itens.length) }), celulas: vazio(13) },
      ];
      return {
        arquivo: arquivoBase,
        titulo, empresa, filtro, emitidoEm,
        secao: empresa ? `${t("nav.empresa")}: ${empresa}` : undefined,
        nota: t(relatorio === "pagar" ? "relatorio.legendaGsPagar" : "relatorio.legendaGs"),
        faixas: [
          { label: "", span: 8 },
          { label: t("relatorio.emAberto"), span: 1 },
          { label: t(relatorio === "receber" ? "relatorio.recebidos" : "relatorio.pagos"), span: 3 },
          { label: "", span: 1 },
        ],
        colunas,
        linhas,
        destaques,
        direita: [5, 6, 7, 8, 9, 10, 11],
        rodapes,
      };
    }

    if (relatorio === "vendas") {
      return {
        arquivo: arquivoBase, titulo, empresa, filtro, emitidoEm, faixas: [],
        colunas: [t("col.id"), t("relatorio.fechamento"), t("venda.client"), t("venda.total"), t("venda.seller")],
        linhas: sortVendas.items.map((e) => [String(e.id), dataHora(e.finalizadaEm ?? e.criadoEm), e.clienteNome, `Gs. ${formatPyg(e.totalPyg)}`, e.vendedorNome]),
        direita: [3],
        rodapes: [{ rotulo: t("relatorio.total"), celulas: ["", "", "", `Gs. ${formatPyg(sortVendas.items.reduce((s, e) => s + e.totalPyg, 0))}`, ""] }],
      };
    }

    if (leituraAtiva === "baixas") {
      const itens = relatorio === "pagar" ? sortBaixasP.items : sortBaixasR.items;
      return {
        arquivo: arquivoBase, titulo, empresa, filtro, emitidoEm, faixas: [],
        colunas: [t("col.date"), t(relatorio === "receber" ? "venda.client" : "nav.fornecedores"), t("relatorio.finalizador"), t("relatorio.total"), t("titulo.desconto"), t("titulo.acrescimo")],
        linhas: itens.map((e) => [dataHora(e.criadoEm), e.pessoaNome, e.finalizadorNome, formatMoeda(e.valor, e.moeda), e.desconto ? formatMoeda(e.desconto, e.moeda) : "—", e.acrescimo ? formatMoeda(e.acrescimo, e.moeda) : "—"]),
        direita: [3, 4, 5],
        rodapes: [{
          rotulo: t("relatorio.total"),
          celulas: ["", "", "", `Gs. ${formatPyg(itens.reduce((s, e) => s + e.valorPyg, 0))}`, `Gs. ${formatPyg(itens.reduce((s, e) => s + e.descontoPyg, 0))}`, `Gs. ${formatPyg(itens.reduce((s, e) => s + e.acrescimoPyg, 0))}`],
        }],
      };
    }

    if (relatorio === "estoque" && leituraAtiva === "movimentos") {
      return {
        arquivo: arquivoBase, titulo, empresa, filtro, emitidoEm, faixas: [],
        colunas: [t("col.date"), t("nav.produtos"), t("nav.estoques"), t("relatorio.tipo"), t("relatorio.anterior"), t("relatorio.tipo.entrada"), t("relatorio.saida"), t("relatorio.saldoEstoque"), t("caixa.note")],
        linhas: sortMov.items.map((e) => {
          const p = partesMovimento(e.quantidade, e.saldoDepois);
          return [dataHora(e.criadoEm), `${e.produtoCodigo} · ${e.produtoNome}`, e.estoqueNome, t(tipoKey(e.tipo)), String(p.anterior), String(p.entrada), String(p.saida), String(p.estoque), e.observacao || "—"];
        }),
        direita: [4, 5, 6, 7],
        rodapes: [{
          rotulo: t("relatorio.total"),
          celulas: [...vazio(5), String(sortMov.items.reduce((s, e) => s + (e.quantidade > 0 ? e.quantidade : 0), 0)), String(sortMov.items.reduce((s, e) => s + (e.quantidade < 0 ? -e.quantidade : 0), 0)), "", ""],
        }],
      };
    }

    return {
      arquivo: arquivoBase, titulo, empresa, filtro, emitidoEm, faixas: [],
      colunas: [t("col.code"), t("common.name"), t("nav.estoques"), t("estoque.qty"), t("estoque.reserved"), t("estoque.available")],
      linhas: sortSaldos.items.map((e) => [e.produtoCodigo, e.produtoNome, e.estoqueNome, String(e.quantidade), String(e.quantidadeReservada), String(e.quantidadeDisponivel)]),
      direita: [3, 4, 5],
      rodapes: [{ rotulo: t("relatorio.total"), celulas: ["", "", "", "", "", String(sortSaldos.items.reduce((s, e) => s + e.quantidadeDisponivel, 0))] }],
    };
  }

  function tabelaTitulo(modo: "receber" | "pagar", ordenados: RelatorioParcela[], sortKey: string, sortDir: "asc" | "desc", onSort: (k: string) => void) {
    const lista = agrupamento === "nenhum"
      ? ordenados
      : [...ordenados].sort((a, b) => agrupamento === "pessoa"
        ? a.pessoaNome.localeCompare(b.pessoaNome) || a.vencimento.localeCompare(b.vencimento)
        : a.vencimento.localeCompare(b.vencimento) || a.pessoaNome.localeCompare(b.pessoaNome));
    const paged = slicePage(lista, page);
    const chaveDe = (e: RelatorioParcela) => agrupamento === "pessoa" ? e.pessoaNome : e.vencimento;
    return (
      <Tabela carregando={carregando} vazio={!ordenados.length} footer={rodape(paged.pageSafe, paged.total, setPage)} classe="relatorio-parcelas">
        <colgroup>
          <col style={{ width: "5%" }} />
          <col style={{ width: "8%" }} />
          <col style={{ width: "5%" }} />
          <col style={{ width: "16%" }} />
          <col style={{ width: "5%" }} />
          <col style={{ width: "4%" }} />
          <col style={{ width: "8%" }} />
          <col style={{ width: "11%" }} />
          <col style={{ width: "8%" }} />
          <col style={{ width: "8%" }} />
          <col style={{ width: "7%" }} />
          <col style={{ width: "7%" }} />
          <col style={{ width: "8%" }} />
        </colgroup>
        <thead>
          <tr>
            <th className="drive-th" colSpan={8} />
            <th className="drive-th text-center" colSpan={1}>{t("relatorio.emAberto")}</th>
            <th className="drive-th text-center" colSpan={3}>{t(modo === "receber" ? "relatorio.recebidos" : "relatorio.pagos")}</th>
            <th className="drive-th" />
          </tr>
          <TableHeadRow sortKey={sortKey} sortDir={sortDir} onSort={onSort} cols={[
            { label: "col.id", sort: "id" },
            { label: "titulo.vencimento", sort: "venc" },
            { label: "relatorio.atraso", sort: "atraso" },
            { label: modo === "receber" ? "venda.client" : "nav.fornecedores", sort: "pessoa" },
            { label: modo === "receber" ? "relatorio.venda" : "relatorio.documento" },
            { label: "relatorio.parcela", sort: "parc" },
            { label: "relatorio.nominal" },
            { label: "relatorio.cotacao" },
            { label: "relatorio.saldo", sort: "saldo" },
            { label: "relatorio.recebido" },
            { label: "titulo.acrescimo" },
            { label: "titulo.desconto" },
            { label: "relatorio.situacao" },
          ]} />
        </thead>
        <tbody>
          {paged.slice.map((e, i) => {
            const atraso = diasAtraso(e.vencimento);
            const idx = (paged.pageSafe - 1) * PAGE_SIZE + i;
            const chave = chaveDe(e);
            const proxima = lista[idx + 1];
            const fechaGrupo = agrupamento !== "nenhum" && (!proxima || chaveDe(proxima) !== chave);
            const grupo = fechaGrupo ? lista.filter((x) => chaveDe(x) === chave) : [];
            const rotuloGrupo = agrupamento === "pessoa"
              ? `${t("relatorio.total")} ${chave}`
              : `${t("relatorio.totalDia")} ${formatarDataIso(chave)}`;
            return (
              <Fragment key={e.id}>
                <tr className="drive-row-clickable" style={{ borderBottom: border1() }} onClick={() => setFichaId(e.idTitulo)}>
                  <Td mono gold>{e.id}</Td>
                  <Td mono>{formatarDataIso(e.vencimento)}</Td>
                  <td className="drive-td font-mono text-xs" style={{ color: atraso && atraso > 0 ? "#ef4444" : v("--text-muted") }}>
                    {atraso && atraso > 0 ? tf(t, "relatorio.dias", { n: String(atraso) }) : "—"}
                  </td>
                  <td className="drive-td nome-clip" title={e.pessoaNome} style={{ color: v("--text-sub") }}>{e.pessoaNome}</td>
                  <Td mono>{e.idDocumento ?? "—"}</Td>
                  <Td mono>{e.numero}</Td>
                  <Td mono>{formatMoeda(e.valor, e.moeda)}</Td>
                  <td
                    className="drive-td cotacao-linha font-mono"
                    title={e.usdPyg || e.brlPyg ? `USD ${e.usdPyg ?? "—"} · BRL ${e.brlPyg ?? "—"}` : undefined}
                  >
                    {e.usdPyg || e.brlPyg ? (
                      <>
                        <div>USD {e.usdPyg ?? "—"}</div>
                        <div>BRL {e.brlPyg ?? "—"}</div>
                      </>
                    ) : "—"}
                  </td>
                  <Td mono>Gs. {formatPyg(e.saldoPyg)}</Td>
                  <Td mono>{e.recebidoPyg ? `Gs. ${formatPyg(e.recebidoPyg)}` : "—"}</Td>
                  <Td mono>{e.acrescimoPyg ? `Gs. ${formatPyg(e.acrescimoPyg)}` : "—"}</Td>
                  <Td mono>{e.descontoPyg ? `Gs. ${formatPyg(e.descontoPyg)}` : "—"}</Td>
                  <Td>{t(statusParcelaKey(e.status))}</Td>
                </tr>
                {fechaGrupo && LINHAS_TOTAL.map(({ moeda, rotulo }, mi) => (
                  <tr key={`total-${chave}-${moeda}`} style={{ borderBottom: mi === LINHAS_TOTAL.length - 1 ? border1() : undefined, background: v("--card2") }}>
                    {mi === 0 && (
                      <td className="drive-td text-xs font-semibold align-top" rowSpan={3} colSpan={7}>{rotuloGrupo}</td>
                    )}
                    <td className="drive-td font-mono text-[11px] whitespace-nowrap" style={{ color: v("--text-muted") }}>{rotulo}</td>
                    {CAMPOS_TOTAL.map((campo) => (
                      <td key={campo} className="drive-td font-mono text-[11px] whitespace-nowrap">
                        {numeroMoeda(somaCampo(grupo, campo, moeda), moeda)}
                      </td>
                    ))}
                    {mi === 0 && <td className="drive-td" rowSpan={3} />}
                  </tr>
                ))}
              </Fragment>
            );
          })}
        </tbody>
      </Tabela>
    );
  }

  function tabelaBaixas(modo: "receber" | "pagar", ordenados: BaixaRelatorio[], sortKey: string, sortDir: "asc" | "desc", onSort: (k: string) => void) {
    const paged = slicePage(ordenados, page);
    return (
      <Tabela carregando={carregando} vazio={!ordenados.length} footer={rodape(paged.pageSafe, paged.total, setPage)}>
        <thead>
          <TableHeadRow sortKey={sortKey} sortDir={sortDir} onSort={onSort} cols={[
            { label: "col.date", sort: "data" },
            { label: modo === "receber" ? "venda.client" : "nav.fornecedores", sort: "pessoa" },
            { label: "relatorio.finalizador", sort: "finalizador" },
            { label: "relatorio.total", sort: "valor" },
            { label: "titulo.desconto" },
            { label: "titulo.acrescimo" },
          ]} />
        </thead>
        <tbody>
          {paged.slice.map((e) => (
            <tr key={e.id} style={{ borderBottom: border1() }}>
              <Td mono>{dataHora(e.criadoEm)}</Td>
              <Td>{e.pessoaNome}</Td>
              <Td>{e.finalizadorNome}</Td>
              <Td mono>{formatMoeda(e.valor, e.moeda)}</Td>
              <Td mono>{e.desconto ? formatMoeda(e.desconto, e.moeda) : "—"}</Td>
              <Td mono>{e.acrescimo ? formatMoeda(e.acrescimo, e.moeda) : "—"}</Td>
            </tr>
          ))}
        </tbody>
      </Tabela>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)", color: v("--text") }}>{t(tituloRelatorio[relatorio])}</h1>
      {erro && <p className="text-sm" style={{ color: "#ef4444" }}>{erro}</p>}
      {(relatorio === "receber" || relatorio === "pagar" || relatorio === "estoque") && (
      <div className="flex flex-wrap items-center gap-3">
        {relatorio === "receber" || relatorio === "pagar" ? (
          <>
            {leituraAtiva !== "baixas" && (
              <>
                <Segmentos value={filtroParcela} onChange={setFiltroParcela} label={t("filter.status.label")} opcoes={[
                  { id: "abertas", label: "titulo.filtro.abertas" },
                  { id: "vencidas", label: "relatorio.vencidas" },
                  { id: "parciais", label: "titulo.filtro.parciais" },
                  { id: "pagas", label: "titulo.filtro.pagas" },
                  { id: "todas", label: "filter.status.all" },
                ]} />
                <Segmentos value={agrupamento} onChange={setAgrupamento} label={t("relatorio.agrupar")} opcoes={[
                  { id: "nenhum", label: "relatorio.agrupar.nenhum" },
                  { id: "pessoa", label: relatorio === "receber" ? "relatorio.agrupar.cliente" : "relatorio.agrupar.fornecedor" },
                  { id: "vencimento", label: "relatorio.agrupar.vencimento" },
                ]} />
              </>
            )}
            <Segmentos value={leituraAtiva === "baixas" ? "baixas" : "posicao"} onChange={setLeitura} label={t("relatorio.parcelas")} opcoes={[
              { id: "posicao", label: "relatorio.parcelas" },
              { id: "baixas", label: "relatorio.baixas" },
            ]} />
          </>
        ) : relatorio === "estoque" ? (
          <Segmentos value={leituraAtiva} onChange={setLeitura} label={t("relatorio.posicao")} opcoes={[
            { id: "posicao", label: "relatorio.posicao" },
            { id: "movimentos", label: "relatorio.movimentos" },
          ]} />
        ) : null}
      </div>
      )}
      <ListToolbar>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={
          relatorio === "receber" && leituraAtiva === "posicao" ? t("relatorio.busca.receber")
            : relatorio === "pagar" && leituraAtiva === "posicao" ? t("relatorio.busca.pagar")
              : relatorio === "receber" && leituraAtiva === "baixas" ? t("relatorio.busca.baixasReceber")
                : relatorio === "pagar" ? t("relatorio.busca.baixasPagar")
                  : relatorio === "vendas" ? t("relatorio.busca.vendas")
                    : relatorio === "estoque" && leituraAtiva === "movimentos" ? t("relatorio.busca.movimentos")
                      : t("relatorio.busca.estoque")
        }
          className="px-3 py-2 text-sm rounded-md outline-none w-72"
          style={{ background: v("--card"), border: border1(), color: v("--text") }} />
        {relatorio === "vendas" && (
          <Segmentos value={periodoVendas} onChange={(id) => {
            setPeriodoVendas(id);
            if (id !== "todas") { setDe(inicioMes()); setAte(fimMes()); }
          }} label={t("relatorio.periodo")} opcoes={[
            { id: "todas", label: "relatorio.periodo.todas" },
            { id: "fechamento", label: "relatorio.fechamento" },
          ]} />
        )}
        {(relatorio === "receber" || relatorio === "pagar") && leituraAtiva === "posicao" && (
          <Segmentos value={campoPeriodo} onChange={(id) => {
            setCampoPeriodo(id);
            if (id !== "todas") { setDe(inicioMes()); setAte(fimMes()); }
          }} label={t("relatorio.periodo")} opcoes={[
            { id: "todas", label: "relatorio.periodo.todas" },
            { id: "emissao", label: "relatorio.periodo.emissao" },
            { id: "vencimento", label: "relatorio.periodo.vencimento" },
          ]} />
        )}
        {(relatorio === "receber" || relatorio === "pagar") && leituraAtiva === "baixas" && (
          <Segmentos value={campoBaixa} onChange={(id) => {
            setCampoBaixa(id);
            if (id !== "todas") { setDe(inicioMes()); setAte(fimMes()); }
          }} label={t("relatorio.periodo")} opcoes={[
            { id: "todas", label: "relatorio.periodo.todas" },
            { id: "movimento", label: relatorio === "pagar" ? "relatorio.periodo.pagamento" : "relatorio.periodo.recebimento" },
          ]} />
        )}
        {((relatorio === "vendas" && periodoVendas === "fechamento") || leituraAtiva === "movimentos" || ((relatorio === "receber" || relatorio === "pagar") && ((leituraAtiva === "posicao" && campoPeriodo !== "todas") || (leituraAtiva === "baixas" && campoBaixa !== "todas")))) && (
          <>
            <label className="flex items-center gap-2 text-xs" style={{ color: v("--text-muted") }}>
              {t("relatorio.de")}
              <input type="date" className="field" style={{ width: "9.5rem" }} value={de} onChange={(e) => setDe(e.target.value)} required={campoPeriodo !== "todas"} />
            </label>
            <label className="flex items-center gap-2 text-xs" style={{ color: v("--text-muted") }}>
              {t("relatorio.ate")}
              <input type="date" className="field" style={{ width: "9.5rem" }} value={ate} onChange={(e) => setAte(e.target.value)} required={campoPeriodo !== "todas"} />
            </label>
          </>
        )}
        {((relatorio === "vendas" && periodoVendas === "fechamento") || ((relatorio === "receber" || relatorio === "pagar") && ((leituraAtiva === "posicao" && campoPeriodo !== "todas") || (leituraAtiva === "baixas" && campoBaixa !== "todas")))) && !datasValidas(de, ate) && (
          <span className="text-xs" style={{ color: "#ef4444" }}>{t("relatorio.periodoInvalido")}</span>
        )}
        {relatorio === "estoque" && leituraAtiva === "posicao" && (
          <Segmentos value={comSaldo ? "com" : "todos"} onChange={(id) => setComSaldo(id === "com")} label={t("relatorio.comSaldo")} opcoes={[
            { id: "com", label: "relatorio.comSaldo" },
            { id: "todos", label: "relatorio.todosSaldos" },
          ]} />
        )}
      </ListToolbar>
      {relatorio === "estoque" && leituraAtiva === "movimentos" && (
        <p className="text-xs" style={{ color: v("--text-muted") }}>{t("relatorio.movimentoInicio")}</p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 text-sm">
        <span style={{ color: v("--text-muted") }}>{tf(t, "relatorio.registros", { n: String(contagem) })}</span>
        <span className="font-mono" style={{ color: v("--text") }}>
          {relatorio === "estoque" && leituraAtiva === "posicao"
            ? `${t("estoque.available")} ${new Intl.NumberFormat("es-PY").format(totalPyg)}`
            : relatorio === "estoque"
              ? `${t("relatorio.tipo.entrada")} ${new Intl.NumberFormat("es-PY").format(sortMov.items.reduce((s, e) => s + (e.quantidade > 0 ? e.quantidade : 0), 0))} · ${t("relatorio.saida")} ${new Intl.NumberFormat("es-PY").format(sortMov.items.reduce((s, e) => s + (e.quantidade < 0 ? -e.quantidade : 0), 0))}`
              : `Gs. ${formatPyg(totalPyg)}`}
        </span>
        {relatorio === "vendas" && cotacao && totalPyg > 0 && (
          <span className="text-xs font-mono" style={{ color: v("--text-muted") }}>
            {formatMoeda(converterMoeda(totalPyg, "pyg", "usd", cotacao), "usd")}
            {" · "}
            {formatMoeda(converterMoeda(totalPyg, "pyg", "brl", cotacao), "brl")}
          </span>
        )}
        {(relatorio === "receber" || relatorio === "pagar") && leituraAtiva === "posicao" && (
          <span className="text-xs font-mono" style={{ color: v("--text-muted") }}>
            {formatMoeda(somaCampo(parcelasOrdenadas, "saldoPyg", "usd"), "usd")}
            {" · "}
            {formatMoeda(somaCampo(parcelasOrdenadas, "saldoPyg", "brl"), "brl")}
          </span>
        )}
        {leituraAtiva === "baixas" && (descPyg > 0 || acrPyg > 0) && (
          <span className="text-xs" style={{ color: v("--text-muted") }}>
            {t("titulo.desconto")} Gs. {formatPyg(descPyg)} · {t("titulo.acrescimo")} Gs. {formatPyg(acrPyg)}
          </span>
        )}
      </div>
        <MenuExportar
          disabled={!contagem || carregando}
          onPdf={() => setFolha(montarFolha())}
          onExcel={() => baixarPlanilha(montarFolha())}
        />
      </div>
      {(relatorio === "receber" || relatorio === "pagar") && leituraAtiva === "posicao" && (
        <p className="text-[11px]" style={{ color: v("--text-muted") }}>{t("relatorio.legendaGs")}</p>
      )}

      {relatorio === "vendas" && (
        <TabelaVendas
          itens={sortVendas.items}
          page={page}
          sortKey={sortVendas.sortKey}
          sortDir={sortVendas.sortDir}
          onSort={sortVendas.onSort}
          carregando={carregando}
          dataHora={dataHora}
          onOpen={setVendaId}
          onPage={setPage}
        />
      )}
      {relatorio === "receber" && leituraAtiva === "posicao" && tabelaTitulo("receber", sortReceber.items, sortReceber.sortKey, sortReceber.sortDir, sortReceber.onSort)}
      {relatorio === "pagar" && leituraAtiva === "posicao" && tabelaTitulo("pagar", sortPagar.items, sortPagar.sortKey, sortPagar.sortDir, sortPagar.onSort)}
      {relatorio === "receber" && leituraAtiva === "baixas" && tabelaBaixas("receber", sortBaixasR.items, sortBaixasR.sortKey, sortBaixasR.sortDir, sortBaixasR.onSort)}
      {relatorio === "pagar" && leituraAtiva === "baixas" && tabelaBaixas("pagar", sortBaixasP.items, sortBaixasP.sortKey, sortBaixasP.sortDir, sortBaixasP.onSort)}
      {relatorio === "estoque" && leituraAtiva === "posicao" && (
        <TabelaSaldos itens={sortSaldos.items} page={page} sortKey={sortSaldos.sortKey} sortDir={sortSaldos.sortDir} onSort={sortSaldos.onSort} carregando={carregando} onPage={setPage} />
      )}
      {relatorio === "estoque" && leituraAtiva === "movimentos" && (
        <TabelaMovimentos itens={sortMov.items} page={page} sortKey={sortMov.sortKey} sortDir={sortMov.sortDir} onSort={sortMov.onSort} carregando={carregando} dataHora={dataHora} onPage={setPage} />
      )}

      {vendaFicha && (
        <VendaFicha
          item={vendaFicha}
          nav={sortVendas.items.length > 1 ? {
            index: vendaIndex,
            total: sortVendas.items.length,
            onPrev: () => { const prev = sortVendas.items[vendaIndex - 1]; if (prev) setVendaId(prev.id); },
            onNext: () => { const next = sortVendas.items[vendaIndex + 1]; if (next) setVendaId(next.id); },
          } : undefined}
          onClose={() => setVendaId(null)}
        />
      )}
      {titulo && (relatorio === "receber" || relatorio === "pagar") && (
        <TituloFicha
          modo={relatorio === "pagar" ? "pagar" : "receber"}
          item={titulo}
          finalizadores={finalizadores}
          caixas={caixas}
          nav={idsTitulo.length > 1 && tituloIndex >= 0 ? {
            index: tituloIndex,
            total: idsTitulo.length,
            onPrev: () => { const prev = idsTitulo[tituloIndex - 1]; if (prev) setFichaId(prev); },
            onNext: () => { const next = idsTitulo[tituloIndex + 1]; if (next) setFichaId(next); },
          } : undefined}
          onClose={() => { setFichaId(null); setTitulo(null); }}
          onUpdated={async (atualizado) => {
            setTitulo(atualizado);
            if (relatorio === "pagar") setPagar(await listarParcelasPagar(idFilial));
            else setReceber(await listarParcelasReceber(idFilial));
          }}
        />
      )}
      {folha && <RelatorioFolha folha={folha} onClose={() => setFolha(null)} />}
    </div>
  );
}

function Tabela({ carregando, vazio, footer, scroll, classe, children }: {
  carregando: boolean; vazio: boolean; footer?: ReactNode; scroll?: boolean; classe?: string; children: ReactNode;
}) {
  const { t } = useI18n();
  return (
    <div className={`rounded-lg ${scroll ? "overflow-x-auto" : "overflow-hidden"}`} style={{ background: v("--card"), border: border1() }}>
      <table className={`drive-table w-full${classe ? ` ${classe}` : ""}`}>
        {children}
      </table>
      {carregando && vazio && <div className="py-12 text-center text-sm" style={{ color: v("--text-muted") }}>{t("common.loading")}</div>}
      {!carregando && vazio && <div className="py-12 text-center text-sm" style={{ color: v("--text-muted") }}>{t("common.noRecords")}</div>}
      {footer}
    </div>
  );
}

function rodape(page: number, total: number, onPage: (p: number) => void) {
  if (total <= 0) return undefined;
  return <TablePagination page={page} total={total} onPageChange={onPage} />;
}

function TabelaVendas({ itens, page, sortKey, sortDir, onSort, carregando, dataHora, onOpen, onPage }: {
  itens: Venda[];
  page: number;
  sortKey: string;
  sortDir: "asc" | "desc";
  onSort: (k: string) => void;
  carregando: boolean;
  dataHora: (ms: number) => string;
  onOpen: (id: number) => void;
  onPage: (p: number) => void;
}) {
  const paged = slicePage(itens, page);
  return (
    <Tabela carregando={carregando} vazio={!itens.length} footer={rodape(paged.pageSafe, paged.total, onPage)}>
      <thead>
        <TableHeadRow sortKey={sortKey} sortDir={sortDir} onSort={onSort} cols={[
          { label: "col.id", sort: "id" },
          { label: "relatorio.fechamento", sort: "data" },
          { label: "venda.client", sort: "cliente" },
          { label: "venda.total", sort: "total" },
          { label: "venda.seller", sort: "vendedor" },
        ]} />
      </thead>
      <tbody>
        {paged.slice.map((e) => (
          <tr key={e.id} className="drive-row-clickable" style={{ borderBottom: border1() }} onClick={() => onOpen(e.id)}>
            <Td mono gold>{e.id}</Td>
            <Td mono>{dataHora(e.finalizadaEm ?? e.criadoEm)}</Td>
            <Td>{e.clienteNome}</Td>
            <Td mono>Gs. {formatPyg(e.totalPyg)}</Td>
            <Td>{e.vendedorNome}</Td>
          </tr>
        ))}
      </tbody>
    </Tabela>
  );
}

function TabelaSaldos({ itens, page, sortKey, sortDir, onSort, carregando, onPage }: {
  itens: EstoqueProduto[];
  page: number;
  sortKey: string;
  sortDir: "asc" | "desc";
  onSort: (k: string) => void;
  carregando: boolean;
  onPage: (p: number) => void;
}) {
  const paged = slicePage(itens, page);
  return (
    <Tabela carregando={carregando} vazio={!itens.length} footer={rodape(paged.pageSafe, paged.total, onPage)}>
      <thead>
        <TableHeadRow sortKey={sortKey} sortDir={sortDir} onSort={onSort} cols={[
          { label: "col.code", sort: "codigo" },
          { label: "common.name", sort: "nome" },
          { label: "nav.estoques", sort: "estoque" },
          { label: "estoque.qty", sort: "qtd" },
          { label: "estoque.reserved", sort: "res" },
          { label: "estoque.available", sort: "disp" },
        ]} />
      </thead>
      <tbody>
        {paged.slice.map((e) => (
          <tr key={e.id} style={{ borderBottom: border1() }}>
            <Td mono>{e.produtoCodigo}</Td>
            <Td>{e.produtoNome}</Td>
            <Td>{e.estoqueNome}</Td>
            <Td mono>{e.quantidade}</Td>
            <Td mono sub>{e.quantidadeReservada}</Td>
            <Td mono>{e.quantidadeDisponivel}</Td>
          </tr>
        ))}
      </tbody>
    </Tabela>
  );
}

function TabelaMovimentos({ itens, page, sortKey, sortDir, onSort, carregando, dataHora, onPage }: {
  itens: EstoqueMovimento[];
  page: number;
  sortKey: string;
  sortDir: "asc" | "desc";
  onSort: (k: string) => void;
  carregando: boolean;
  dataHora: (ms: number) => string;
  onPage: (p: number) => void;
}) {
  const { t } = useI18n();
  const paged = slicePage(itens, page);
  return (
    <Tabela carregando={carregando} vazio={!itens.length} footer={rodape(paged.pageSafe, paged.total, onPage)}>
      <thead>
        <TableHeadRow sortKey={sortKey} sortDir={sortDir} onSort={onSort} cols={[
          { label: "col.date", sort: "data" },
          { label: "nav.produtos", sort: "produto" },
          { label: "nav.estoques", sort: "estoque" },
          { label: "relatorio.tipo", sort: "tipo" },
          { label: "relatorio.anterior", sort: "anterior" },
          { label: "relatorio.tipo.entrada", sort: "entrada" },
          { label: "relatorio.saida", sort: "saida" },
          { label: "relatorio.saldoEstoque", sort: "estoque" },
          { label: "caixa.note" },
        ]} />
      </thead>
      <tbody>
        {paged.slice.map((e) => {
          const p = partesMovimento(e.quantidade, e.saldoDepois);
          return (
          <tr key={e.id} style={{ borderBottom: border1() }}>
            <Td mono>{dataHora(e.criadoEm)}</Td>
            <Td>{e.produtoCodigo} · {e.produtoNome}</Td>
            <Td>{e.estoqueNome}</Td>
            <Td>{t(tipoKey(e.tipo))}</Td>
            <Td mono>{p.anterior}</Td>
            <td className="drive-td font-mono text-xs" style={{ color: p.entrada > 0 ? "#16a34a" : v("--text-muted") }}>{p.entrada}</td>
            <td className="drive-td font-mono text-xs" style={{ color: p.saida > 0 ? "#ef4444" : v("--text-muted") }}>{p.saida}</td>
            <Td mono>{p.estoque}</Td>
            <Td sub>{e.observacao || "—"}</Td>
          </tr>
          );
        })}
      </tbody>
    </Tabela>
  );
}
