import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { ListToolbar, TableHeadRow, TablePagination, Td, useListSort } from "@/components/crud/ListUi";
import TituloFicha from "@/components/TituloFicha";
import VendaFicha from "@/components/VendaFicha";
import { useCrudReset } from "@/hooks/useCrudReset";
import { useI18n } from "@/i18n";
import type { TranslationKey } from "@/i18n";
import { tf } from "@/i18n/format";
import { mensagemErroApi } from "@/i18n/apiMessages";
import { useAuth } from "@/auth/AuthContext";
import { useFilialId } from "@/auth/FilialContext";
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
  listarTitulosPagar,
  listarTitulosReceber,
  listarVendas,
  type BaixaRelatorio,
  type Caixa,
  type EstoqueMovimento,
  type EstoqueProduto,
  type Finalizador,
  type TituloPagar,
  type TituloPagarResumo,
  type TituloReceber,
  type TituloReceberResumo,
  type Venda,
} from "@/api";
import { formatMoeda, formatPyg, formatarDataHoraEpoch, formatarDataIso, slicePage } from "@/format";

const v = (name: string) => `var(${name})`;
const border1 = () => `1px solid ${v("--border")}`;

type RelatorioId = "vendas" | "receber" | "pagar" | "estoque";
type Leitura = "posicao" | "baixas" | "movimentos";

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

function formatQtd(n: number): string {
  const abs = new Intl.NumberFormat("es-PY").format(Math.abs(n));
  if (n > 0) return `+${abs}`;
  if (n < 0) return `−${abs}`;
  return abs;
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

export default function RelatoriosPage({ navReset }: { navReset: number }) {
  const { t, locale } = useI18n();
  const { hasPermission } = useAuth();
  const idFilial = useFilialId();
  const podeVenda = hasPermission(Permissao.VENDA_REGISTRAR);
  const podeFin = hasPermission(Permissao.FINANCEIRO_OPERAR);
  const podeEstoque = hasPermission(Permissao.ESTOQUE_CONSULTAR) || hasPermission(Permissao.ESTOQUE_GERENCIAR);

  const opcoes = useMemo(() => {
    const lista: { id: RelatorioId; label: TranslationKey }[] = [];
    if (podeVenda) lista.push({ id: "vendas", label: "relatorio.vendas" });
    if (podeFin) {
      lista.push({ id: "receber", label: "relatorio.receber" });
      lista.push({ id: "pagar", label: "relatorio.pagar" });
    }
    if (podeEstoque) lista.push({ id: "estoque", label: "relatorio.estoque" });
    return lista;
  }, [podeVenda, podeFin, podeEstoque]);

  const [relatorio, setRelatorio] = useState<RelatorioId>(opcoes[0]?.id ?? "vendas");
  const [leitura, setLeitura] = useState<Leitura>("posicao");
  const [search, setSearch] = useState("");
  const [de, setDe] = useState(inicioMes);
  const [ate, setAte] = useState(isoNoFuso);
  const [comSaldo, setComSaldo] = useState(true);
  const [page, setPage] = useState(1);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const [vendas, setVendas] = useState<Venda[]>([]);
  const [receber, setReceber] = useState<TituloReceberResumo[]>([]);
  const [pagar, setPagar] = useState<TituloPagarResumo[]>([]);
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

  useEffect(() => {
    if (opcoes.length && !opcoes.some((o) => o.id === relatorio)) setRelatorio(opcoes[0].id);
  }, [opcoes, relatorio]);

  const usaPeriodo = relatorio === "vendas" || leitura === "baixas" || leitura === "movimentos";
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
      listarTitulosReceber(idFilial).then((r) => { if (ativo) setReceber(r); }).catch(falha).finally(fim);
    } else if (relatorio === "receber") {
      listarBaixasReceber(idFilial).then((r) => { if (ativo) setBaixasReceber(r); }).catch(falha).finally(fim);
    } else if (relatorio === "pagar" && leituraAtiva === "posicao") {
      listarTitulosPagar(idFilial).then((r) => { if (ativo) setPagar(r); }).catch(falha).finally(fim);
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
    noPeriodo(e.criadoEm, de, ate) &&
    `${e.id} ${e.clienteNome} ${e.vendedorNome}`.toLowerCase().includes(q),
  ), [vendas, de, ate, q]);
  const receberAberto = useMemo(() => receber.filter((e) =>
    (e.status === "aberto" || e.status === "parcial") &&
    e.clienteNome.toLowerCase().includes(q),
  ), [receber, q]);
  const pagarAberto = useMemo(() => pagar.filter((e) =>
    (e.status === "aberto" || e.status === "parcial") &&
    e.fornecedorNome.toLowerCase().includes(q),
  ), [pagar, q]);
  const baixasR = useMemo(() => baixasReceber.filter((e) =>
    noPeriodo(e.criadoEm, de, ate) &&
    `${e.pessoaNome} ${e.finalizadorNome}`.toLowerCase().includes(q),
  ), [baixasReceber, de, ate, q]);
  const baixasP = useMemo(() => baixasPagar.filter((e) =>
    noPeriodo(e.criadoEm, de, ate) &&
    `${e.pessoaNome} ${e.finalizadorNome}`.toLowerCase().includes(q),
  ), [baixasPagar, de, ate, q]);
  const saldosFiltrados = useMemo(() => saldos.filter((e) =>
    (!comSaldo || e.quantidadeDisponivel > 0) &&
    `${e.produtoCodigo} ${e.produtoNome} ${e.estoqueNome}`.toLowerCase().includes(q),
  ), [saldos, comSaldo, q]);
  const movimentosFiltrados = useMemo(() => movimentos.filter((e) =>
    noPeriodo(e.criadoEm, de, ate) &&
    `${e.produtoCodigo} ${e.produtoNome} ${e.estoqueNome} ${e.observacao ?? ""}`.toLowerCase().includes(q),
  ), [movimentos, de, ate, q]);

  const sortVendas = useListSort(vendasFiltradas, (e, k) => {
    if (k === "data") return e.criadoEm;
    if (k === "cliente") return e.clienteNome;
    if (k === "total") return e.totalPyg;
    if (k === "vendedor") return e.vendedorNome;
    return e.id;
  }, "data", "desc");
  const sortReceber = useListSort(receberAberto, (e, k) => {
    if (k === "pessoa") return e.clienteNome;
    if (k === "venc") return e.proximoVencimento ?? "";
    if (k === "atraso") return diasAtraso(e.proximoVencimento) ?? 0;
    if (k === "saldo") return e.saldoPyg;
    return e.id;
  }, "venc", "asc");
  const sortPagar = useListSort(pagarAberto, (e, k) => {
    if (k === "pessoa") return e.fornecedorNome;
    if (k === "venc") return e.proximoVencimento ?? "";
    if (k === "atraso") return diasAtraso(e.proximoVencimento) ?? 0;
    if (k === "saldo") return e.saldoPyg;
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
    if (k === "qtd") return e.quantidade;
    if (k === "saldo") return e.saldoDepois;
    return e.tipo;
  }, "data", "desc");

  useEffect(() => { setPage(1); }, [search, de, ate, comSaldo, relatorio, leituraAtiva, sortVendas.sortKey, sortVendas.sortDir]);

  const dataHora = (ms: number) => formatarDataHoraEpoch(ms, locale === "es" ? "es-PY" : "pt-BR");

  function escolher(id: RelatorioId) {
    setRelatorio(id);
    setLeitura((atual) => {
      if (id === "vendas") return "posicao";
      if (id === "estoque") return atual === "baixas" || atual === "movimentos" ? "movimentos" : "posicao";
      return atual === "movimentos" || atual === "baixas" ? "baixas" : "posicao";
    });
    setVendaId(null);
    setFichaId(null);
    setTitulo(null);
  }

  const vendaIndex = vendaId != null ? sortVendas.items.findIndex((e) => e.id === vendaId) : -1;
  const vendaFicha = vendaIndex >= 0 ? sortVendas.items[vendaIndex] : null;
  const titulosOrdenados = relatorio === "pagar" ? sortPagar.items : sortReceber.items;
  const tituloIndex = fichaId != null ? titulosOrdenados.findIndex((e) => e.id === fichaId) : -1;

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

  function tabelaTitulo(modo: "receber" | "pagar", ordenados: (TituloReceberResumo | TituloPagarResumo)[], sortKey: string, sortDir: "asc" | "desc", onSort: (k: string) => void) {
    const paged = slicePage(ordenados, page);
    return (
      <Tabela carregando={carregando} vazio={!ordenados.length} footer={rodape(paged.pageSafe, paged.total, setPage)}>
        <thead>
          <TableHeadRow sortKey={sortKey} sortDir={sortDir} onSort={onSort} cols={[
            { label: modo === "receber" ? "venda.client" : "nav.fornecedores", sort: "pessoa" },
            { label: "titulo.vencimento", sort: "venc" },
            { label: "relatorio.atraso", sort: "atraso" },
            { label: "titulo.moeda" },
            { label: "relatorio.total", sort: "saldo" },
          ]} />
        </thead>
        <tbody>
          {paged.slice.map((e) => {
            const atraso = diasAtraso(e.proximoVencimento);
            const nome = "clienteNome" in e ? e.clienteNome : e.fornecedorNome;
            return (
              <tr key={e.id} className="drive-row-clickable" style={{ borderBottom: border1() }} onClick={() => setFichaId(e.id)}>
                <Td>{nome}</Td>
                <Td mono>{e.proximoVencimento ? formatarDataIso(e.proximoVencimento) : "—"}</Td>
                <td className="drive-td font-mono text-xs" style={{ color: atraso && atraso > 0 ? "#ef4444" : v("--text-muted") }}>
                  {atraso && atraso > 0 ? tf(t, "relatorio.dias", { n: String(atraso) }) : "—"}
                </td>
                <Td mono>{e.moeda.toUpperCase()}</Td>
                <Td mono>Gs. {formatPyg(e.saldoPyg)}</Td>
              </tr>
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
      <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)", color: v("--text") }}>{t("nav.relatorios")}</h1>
      {erro && <p className="text-sm" style={{ color: "#ef4444" }}>{erro}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <Segmentos value={relatorio} onChange={escolher} opcoes={opcoes} label={t("nav.relatorios")} />
        {relatorio === "receber" || relatorio === "pagar" ? (
          <Segmentos value={leituraAtiva} onChange={setLeitura} label={t("relatorio.posicao")} opcoes={[
            { id: "posicao", label: "relatorio.posicao" },
            { id: "baixas", label: "relatorio.baixas" },
          ]} />
        ) : relatorio === "estoque" ? (
          <Segmentos value={leituraAtiva} onChange={setLeitura} label={t("relatorio.posicao")} opcoes={[
            { id: "posicao", label: "relatorio.posicao" },
            { id: "movimentos", label: "relatorio.movimentos" },
          ]} />
        ) : null}
      </div>
      <ListToolbar>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("common.search")}
          className="px-3 py-2 text-sm rounded-md outline-none w-64"
          style={{ background: v("--card"), border: border1(), color: v("--text") }} />
        {usaPeriodo && (
          <>
            <label className="flex items-center gap-2 text-xs" style={{ color: v("--text-muted") }}>
              {t("relatorio.de")}
              <input type="date" className="field" style={{ width: "9.5rem" }} value={de} onChange={(e) => setDe(e.target.value)} />
            </label>
            <label className="flex items-center gap-2 text-xs" style={{ color: v("--text-muted") }}>
              {t("relatorio.ate")}
              <input type="date" className="field" style={{ width: "9.5rem" }} value={ate} onChange={(e) => setAte(e.target.value)} />
            </label>
          </>
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
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 text-sm">
        <span style={{ color: v("--text-muted") }}>{tf(t, "relatorio.registros", { n: String(contagem) })}</span>
        <span className="font-mono" style={{ color: v("--text") }}>
          {relatorio === "estoque" && leituraAtiva === "posicao"
            ? `${t("estoque.available")} ${new Intl.NumberFormat("es-PY").format(totalPyg)}`
            : relatorio === "estoque"
              ? formatQtd(totalPyg)
              : `Gs. ${formatPyg(totalPyg)}`}
        </span>
        {leituraAtiva === "baixas" && (descPyg > 0 || acrPyg > 0) && (
          <span className="text-xs" style={{ color: v("--text-muted") }}>
            {t("titulo.desconto")} Gs. {formatPyg(descPyg)} · {t("titulo.acrescimo")} Gs. {formatPyg(acrPyg)}
          </span>
        )}
      </div>

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
          nav={titulosOrdenados.length > 1 && tituloIndex >= 0 ? {
            index: tituloIndex,
            total: titulosOrdenados.length,
            onPrev: () => { const prev = titulosOrdenados[tituloIndex - 1]; if (prev) setFichaId(prev.id); },
            onNext: () => { const next = titulosOrdenados[tituloIndex + 1]; if (next) setFichaId(next.id); },
          } : undefined}
          onClose={() => { setFichaId(null); setTitulo(null); }}
          onUpdated={async (atualizado) => {
            setTitulo(atualizado);
            if (relatorio === "pagar") setPagar(await listarTitulosPagar(idFilial));
            else setReceber(await listarTitulosReceber(idFilial));
          }}
        />
      )}
    </div>
  );
}

function Tabela({ carregando, vazio, footer, children }: {
  carregando: boolean; vazio: boolean; footer?: ReactNode; children: ReactNode;
}) {
  const { t } = useI18n();
  return (
    <div className="rounded-lg overflow-hidden" style={{ background: v("--card"), border: border1() }}>
      <table className="drive-table w-full">
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
          { label: "col.date", sort: "data" },
          { label: "venda.client", sort: "cliente" },
          { label: "venda.total", sort: "total" },
          { label: "venda.seller", sort: "vendedor" },
        ]} />
      </thead>
      <tbody>
        {paged.slice.map((e) => (
          <tr key={e.id} className="drive-row-clickable" style={{ borderBottom: border1() }} onClick={() => onOpen(e.id)}>
            <Td mono gold>{e.id}</Td>
            <Td mono>{dataHora(e.criadoEm)}</Td>
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
          { label: "estoque.qty", sort: "qtd" },
          { label: "relatorio.saldoDepois", sort: "saldo" },
          { label: "caixa.note" },
        ]} />
      </thead>
      <tbody>
        {paged.slice.map((e) => (
          <tr key={e.id} style={{ borderBottom: border1() }}>
            <Td mono>{dataHora(e.criadoEm)}</Td>
            <Td>{e.produtoCodigo} · {e.produtoNome}</Td>
            <Td>{e.estoqueNome}</Td>
            <Td>{t(tipoKey(e.tipo))}</Td>
            <td className="drive-td font-mono text-xs" style={{ color: e.quantidade < 0 ? "#ef4444" : e.quantidade > 0 ? "#16a34a" : v("--text-muted") }}>
              {formatQtd(e.quantidade)}
            </td>
            <Td mono>{e.saldoDepois}</Td>
            <Td sub>{e.observacao || "—"}</Td>
          </tr>
        ))}
      </tbody>
    </Tabela>
  );
}
