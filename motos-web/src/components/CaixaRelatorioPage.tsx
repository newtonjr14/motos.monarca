import { useEffect, useMemo, useRef, useState } from "react";
import { ListToolbar, TableHeadRow, TablePagination, Td, useListSort } from "@/components/crud/ListUi";
import RelatorioFolha, { baixarPlanilha, type FolhaRelatorio } from "@/components/RelatorioFolha";
import { useCrudReset } from "@/hooks/useCrudReset";
import { useI18n } from "@/i18n";
import type { TranslationKey } from "@/i18n";
import { mensagemErroApi } from "@/i18n/apiMessages";
import { tf } from "@/i18n/format";
import { useFilial, useFilialId } from "@/auth/FilialContext";
import {
  listarCaixaMovimentacoes,
  listarCaixaSessoes,
  listarCaixas,
  type Caixa,
  type CaixaMovimentacao,
  type CaixaSessao,
  type TipoMovimentacaoCaixa,
} from "@/api";
import { formatMoeda, formatarDataHoraEpoch, formatarDataIso, slicePage } from "@/format";

const v = (name: string) => `var(${name})`;

const ORDEM_MOEDA = ["pyg", "usd", "brl"];

const ENTRADA = new Set<TipoMovimentacaoCaixa>(["venda", "recebimento", "suprimento", "transferencia_entrada"]);
const SAIDA = new Set<TipoMovimentacaoCaixa>(["pagamento", "sangria", "transferencia_saida"]);

type LinhaMov = {
  chave: string;
  criadoEm: number;
  historico: string;
  entrada: string;
  saida: string;
  busca: string;
};

type SaldoFin = {
  chave: string;
  nome: string;
  moeda: string;
  anterior: number;
  entrada: number;
  saida: number;
};

function siglaMoeda(moeda: string): string {
  if (moeda === "usd") return "USD";
  if (moeda === "brl") return "BRL";
  return "PYG";
}

function ladoMovimento(tipo: TipoMovimentacaoCaixa): "entrada" | "saida" | null {
  if (ENTRADA.has(tipo)) return "entrada";
  if (SAIDA.has(tipo)) return "saida";
  return null;
}

function TabelaSaldo({ titulo, primeira, linhas }: {
  titulo: string;
  primeira: TranslationKey;
  linhas: SaldoFin[];
}) {
  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold" style={{ color: v("--text") }}>{titulo}</h2>
      <div className="rounded-lg overflow-x-auto" style={{ background: v("--card"), border: `1px solid ${v("--border")}` }}>
        <table className="drive-table w-full">
          <thead>
            <TableHeadRow cols={[
              { label: primeira },
              { label: "relatorio.anterior", align: "right" },
              { label: "relatorio.tipo.entrada", align: "right" },
              { label: "relatorio.saida", align: "right" },
              { label: "relatorio.saldo", align: "right" },
            ]} />
          </thead>
          <tbody>
            {linhas.map((s) => (
              <tr key={s.chave} style={{ borderBottom: `1px solid ${v("--border")}` }}>
                <Td>{s.nome}</Td>
                <Td mono right>{formatMoeda(s.anterior, s.moeda)}</Td>
                <Td mono right>{formatMoeda(s.entrada, s.moeda)}</Td>
                <Td mono right>{formatMoeda(s.saida, s.moeda)}</Td>
                <Td mono right>{formatMoeda(s.anterior + s.entrada - s.saida, s.moeda)}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
        onClick={() => setAberto((atual) => !atual)}
      >
        {t("relatorio.exportar")}
      </button>
      {aberto && !disabled && (
        <div
          className="absolute right-0 z-20 mt-1 min-w-[9rem] rounded-md py-1 shadow-lg"
          style={{ background: v("--card"), border: `1px solid ${v("--border")}` }}
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

export default function CaixaRelatorioPage({ navReset }: { navReset: number }) {
  const { t, locale } = useI18n();
  const { filial } = useFilial();
  const idFilial = useFilialId();
  const [caixas, setCaixas] = useState<Caixa[]>([]);
  const [idCaixa, setIdCaixa] = useState<number | null>(null);
  const [sessoes, setSessoes] = useState<CaixaSessao[]>([]);
  const [indice, setIndice] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [itens, setItens] = useState<CaixaMovimentacao[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [folha, setFolha] = useState<FolhaRelatorio | null>(null);

  const reset = () => {
    setSearch("");
    setPage(1);
    setIndice(0);
    setIdCaixa(null);
    setFolha(null);
  };
  useCrudReset(navReset, reset);

  useEffect(() => {
    let cancel = false;
    listarCaixas(idFilial)
      .then((lista) => {
        if (cancel) return;
        const ativos = lista.filter((c) => c.status === "ativo");
        setCaixas(ativos);
        setIdCaixa((atual) => (atual != null && ativos.some((c) => c.id === atual) ? atual : null));
        setErro(null);
      })
      .catch((e) => { if (!cancel) setErro(mensagemErroApi(e, t, "common.error.loadFailed")); });
    return () => { cancel = true; };
  }, [idFilial, t]);

  useEffect(() => {
    if (idCaixa == null) {
      setSessoes([]);
      setIndice(0);
      return;
    }
    let cancel = false;
    listarCaixaSessoes(idCaixa)
      .then((lista) => {
        if (cancel) return;
        setSessoes(lista);
        setIndice(0);
        setErro(null);
      })
      .catch((e) => { if (!cancel) setErro(mensagemErroApi(e, t, "common.error.loadFailed")); });
    return () => { cancel = true; };
  }, [idCaixa, t]);

  const sessao = sessoes[indice] ?? null;

  useEffect(() => {
    if (!sessao) {
      setItens([]);
      return;
    }
    let cancel = false;
    setCarregando(true);
    listarCaixaMovimentacoes(sessao.id)
      .then((lista) => { if (!cancel) { setItens(lista); setErro(null); } })
      .catch((e) => { if (!cancel) setErro(mensagemErroApi(e, t, "common.error.loadFailed")); })
      .finally(() => { if (!cancel) setCarregando(false); });
    return () => { cancel = true; };
  }, [sessao?.id, t]);

  useEffect(() => { setPage(1); }, [search, sessao?.id]);

  const dataHora = (ms: number) => formatarDataHoraEpoch(ms, locale === "es" ? "es-PY" : "pt-BR");

  const linhas = useMemo(() => {
    const saida: LinhaMov[] = [];
    for (const m of itens) {
      const lado = ladoMovimento(m.tipo);
      if (!lado) continue;
      const partes = m.finalizadores.length ? m.finalizadores : [null];
      partes.forEach((f, i) => {
        const tipo = t(`caixa.mov.${m.tipo}` as TranslationKey);
        const venda = m.idVenda ? ` ${m.idVenda}` : "";
        const nome = f?.finalizadorNome?.trim() ?? "";
        const fin = nome ? ` · ${nome}` : "";
        const forn = m.fornecedorNome?.trim() ? ` · ${m.fornecedorNome.trim()}` : "";
        const obs = m.observacao?.trim() ? ` · ${m.observacao.trim()}` : "";
        const historico = `${tipo}${venda}${fin}${forn}${obs}`;
        const valor = f ? formatMoeda(f.valor, f.moeda ?? "pyg") : "";
        saida.push({
          chave: `${m.id}-${i}`,
          criadoEm: m.criadoEm,
          historico,
          entrada: lado === "entrada" ? valor : "",
          saida: lado === "saida" ? valor : "",
          busca: `${m.usuarioNome} ${historico} ${m.idVenda ?? ""} ${f?.moeda ?? ""}`.toLowerCase(),
        });
      });
    }
    return saida;
  }, [itens, t]);

  const saldos = useMemo(() => {
    const mapa = new Map<string, SaldoFin>();
    for (const m of itens) {
      for (const f of m.finalizadores) {
        const moeda = f.moeda ?? "pyg";
        const chave = `${f.idFinalizador}-${moeda}`;
        const atual = mapa.get(chave) ?? {
          chave,
          nome: `${f.finalizadorNome?.trim() || String(f.idFinalizador)} - ${siglaMoeda(moeda)}`,
          moeda,
          anterior: 0,
          entrada: 0,
          saida: 0,
        };
        if (m.tipo === "abertura") atual.anterior += f.valor;
        else if (ENTRADA.has(m.tipo)) atual.entrada += f.valor;
        else if (SAIDA.has(m.tipo)) atual.saida += f.valor;
        mapa.set(chave, atual);
      }
    }
    return [...mapa.values()]
      .filter((s) => s.anterior !== 0 || s.entrada !== 0 || s.saida !== 0)
      .sort((a, b) => a.nome.localeCompare(b.nome) || a.moeda.localeCompare(b.moeda));
  }, [itens]);

  const saldosMoeda = useMemo(() => {
    const mapa = new Map<string, SaldoFin>();
    for (const s of saldos) {
      const atual = mapa.get(s.moeda) ?? {
        chave: s.moeda,
        nome: siglaMoeda(s.moeda),
        moeda: s.moeda,
        anterior: 0,
        entrada: 0,
        saida: 0,
      };
      atual.anterior += s.anterior;
      atual.entrada += s.entrada;
      atual.saida += s.saida;
      mapa.set(s.moeda, atual);
    }
    return [...mapa.values()].sort((a, b) => {
      const ia = ORDEM_MOEDA.indexOf(a.moeda);
      const ib = ORDEM_MOEDA.indexOf(b.moeda);
      return (ia < 0 ? ORDEM_MOEDA.length : ia) - (ib < 0 ? ORDEM_MOEDA.length : ib);
    });
  }, [saldos]);

  const q = search.trim().toLowerCase();
  const filtrados = useMemo(
    () => linhas.filter((l) => l.busca.includes(q)),
    [linhas, q],
  );

  const sort = useListSort(filtrados, (e, k) => {
    if (k === "data") return e.criadoEm;
    if (k === "historico") return e.historico;
    return e.criadoEm;
  }, "data", "asc");
  const paged = slicePage(sort.items, page);

  function rotuloAbertura(s: CaixaSessao): string {
    const data = formatarDataIso(s.data);
    const repetida = sessoes.filter((x) => x.data === s.data).length > 1;
    return repetida ? dataHora(s.abertoEm) : data;
  }

  const aviso = sessao
    ? sessao.status === "aberto"
      ? tf(t, "caixa.relatorio.sessaoAberta", { usuario: sessao.usuarioAberturaNome })
      : tf(t, "caixa.relatorio.sessaoFechada", {
          usuario: sessao.usuarioAberturaNome,
          fechamento: sessao.fechadoEm ? dataHora(sessao.fechadoEm) : "—",
          fechou: sessao.usuarioFechamentoNome ?? "—",
        })
    : null;

  function montarFolha(): FolhaRelatorio {
    const caixa = caixas.find((c) => c.id === idCaixa);
    const titulo = t("nav.relatorioCaixa");
    const empresa = filial?.nome ?? "";
    const abertura = sessao ? rotuloAbertura(sessao) : "";
    const filtro = [caixa?.nome, abertura, aviso].filter(Boolean).join(" · ");
    const colunas = [t("col.date"), t("caixa.relatorio.historico"), t("relatorio.tipo.entrada"), t("relatorio.saida")];
    const linhasFolha = sort.items.map((l) => [dataHora(l.criadoEm), l.historico, l.entrada, l.saida]);
    const anexoDe = (titulo: string, primeira: string, linhasSaldo: SaldoFin[]) => ({
      titulo,
      colunas: [
        primeira,
        t("relatorio.anterior"),
        t("relatorio.tipo.entrada"),
        t("relatorio.saida"),
        t("relatorio.saldo"),
      ],
      linhas: linhasSaldo.map((s) => [
        s.nome,
        formatMoeda(s.anterior, s.moeda),
        formatMoeda(s.entrada, s.moeda),
        formatMoeda(s.saida, s.moeda),
        formatMoeda(s.anterior + s.entrada - s.saida, s.moeda),
      ]),
      direita: [1, 2, 3, 4],
    });
    const anexos = [
      ...(saldos.length ? [anexoDe(t("caixa.relatorio.saldoPorFinalizador"), t("relatorio.finalizador"), saldos)] : []),
      ...(saldosMoeda.length ? [anexoDe(t("caixa.relatorio.saldoPorMoeda"), t("produto.currency"), saldosMoeda)] : []),
    ];
    return {
      arquivo: "movimento-caixa",
      titulo,
      empresa,
      filtro,
      emitidoEm: dataHora(Date.now()),
      faixas: [],
      colunas,
      linhas: linhasFolha,
      direita: [2, 3],
      rodapes: [{ rotulo: tf(t, "relatorio.registros", { n: String(sort.items.length) }), celulas: ["", "", "", ""] }],
      anexos,
    };
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)", color: v("--text") }}>{t("nav.relatorioCaixa")}</h1>
      {erro && <p className="text-sm" style={{ color: "#ef4444" }}>{erro}</p>}
      <ListToolbar>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("relatorio.busca.caixa")}
          className="px-3 py-2 text-sm rounded-md outline-none w-72"
          style={{ background: v("--card"), border: `1px solid ${v("--border")}`, color: v("--text") }}
        />
        <label className="flex items-center gap-2 text-xs" style={{ color: v("--text-muted") }}>
          {t("relatorio.caixa")}
          <select
            className="field"
            style={{ width: "12rem" }}
            value={idCaixa ?? ""}
            onChange={(e) => setIdCaixa(e.target.value === "" ? null : Number(e.target.value))}
          >
            <option value="">{t("common.select")}</option>
            {caixas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </label>
        <div className="flex items-center gap-1 text-xs" style={{ color: v("--text-muted") }}>
          <span>{t("caixa.relatorio.abertura")}</span>
          <button
            type="button"
            className="caixa-nav-btn px-2 py-1 text-sm"
            disabled={!sessao || indice >= sessoes.length - 1}
            aria-label={t("caixa.relatorio.anterior")}
            onClick={() => setIndice((i) => Math.min(sessoes.length - 1, i + 1))}
          >
            ‹
          </button>
          <span className="font-mono min-w-[6.5rem] text-center" style={{ color: v("--text") }}>
            {sessao ? rotuloAbertura(sessao) : "—"}
          </span>
          <button
            type="button"
            className="caixa-nav-btn px-2 py-1 text-sm"
            disabled={!sessao || indice <= 0}
            aria-label={t("caixa.relatorio.proxima")}
            onClick={() => setIndice((i) => Math.max(0, i - 1))}
          >
            ›
          </button>
          <button
            type="button"
            className="caixa-nav-btn px-2 py-1 text-sm"
            disabled={!sessao || indice <= 0}
            aria-label={t("caixa.relatorio.maisRecente")}
            onClick={() => setIndice(0)}
          >
            »
          </button>
        </div>
      </ListToolbar>
      {caixas.length === 0 && <p className="text-sm" style={{ color: v("--text-muted") }}>{t("caixa.relatorio.semCaixa")}</p>}
      {idCaixa != null && sessoes.length === 0 && <p className="text-sm" style={{ color: v("--text-muted") }}>{t("caixa.relatorio.semSessao")}</p>}
      {aviso && <p className="text-sm break-words" style={{ color: v("--text-muted") }}>{aviso}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm" style={{ color: v("--text-muted") }}>{tf(t, "relatorio.registros", { n: String(filtrados.length) })}</span>
        <MenuExportar
          disabled={!sessao || carregando}
          onPdf={() => setFolha(montarFolha())}
          onExcel={() => baixarPlanilha(montarFolha())}
        />
      </div>
      <div className="rounded-lg overflow-x-auto" style={{ background: v("--card"), border: `1px solid ${v("--border")}` }}>
        <table className="drive-table w-full">
          <thead>
            <TableHeadRow sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.onSort} cols={[
              { label: "col.date", sort: "data" },
              { label: "caixa.relatorio.historico", sort: "historico" },
              { label: "relatorio.tipo.entrada", align: "right" },
              { label: "relatorio.saida", align: "right" },
            ]} />
          </thead>
          <tbody>
            {!carregando && paged.slice.map((l) => (
              <tr key={l.chave} style={{ borderBottom: `1px solid ${v("--border")}` }}>
                <Td mono nowrap>{dataHora(l.criadoEm)}</Td>
                <Td>{l.historico}</Td>
                <Td mono right>{l.entrada}</Td>
                <Td mono right>{l.saida}</Td>
              </tr>
            ))}
          </tbody>
        </table>
        {!carregando && sessao && !filtrados.length && (
          <div className="py-12 text-center text-sm" style={{ color: v("--text-muted") }}>{t("common.noRecords")}</div>
        )}
        {filtrados.length > 0 && <TablePagination page={paged.pageSafe} total={paged.total} onPageChange={setPage} />}
      </div>
      {sessao && saldos.length > 0 && (
        <TabelaSaldo titulo={t("caixa.relatorio.saldoPorFinalizador")} primeira="relatorio.finalizador" linhas={saldos} />
      )}
      {sessao && saldosMoeda.length > 0 && (
        <TabelaSaldo titulo={t("caixa.relatorio.saldoPorMoeda")} primeira="produto.currency" linhas={saldosMoeda} />
      )}
      {folha && <RelatorioFolha folha={folha} onClose={() => setFolha(null)} />}
    </div>
  );
}
