import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { listarProdutos, type Produto, type TipoProduto } from "@/api";
import { useFilial, useFilialId } from "@/auth/FilialContext";
import { useCotacaoHoje } from "@/components/CotacaoBanner";
import ProdutoFicha from "@/components/ProdutoFicha";
import RelatorioFolha, { baixarPlanilha, type FolhaRelatorio } from "@/components/RelatorioFolha";
import {
  ListToolbar,
  StatusFilter,
  StatusTexto,
  TableHeadRow,
  TablePagination,
  Td,
  passaFiltroStatus,
  useListSort,
  type FiltroStatus,
} from "@/components/crud/ListUi";
import { useCrudReset } from "@/hooks/useCrudReset";
import { useI18n } from "@/i18n";
import type { TranslationKey } from "@/i18n";
import { mensagemErroApi } from "@/i18n/apiMessages";
import { tf } from "@/i18n/format";
import { converterMoeda, formatMoeda, formatarDataHoraEpoch, moedaOperacaoDe, slicePage } from "@/format";

const v = (name: string) => `var(${name})`;
const border1 = () => `1px solid ${v("--border")}`;

type FiltroTipo = "todos" | TipoProduto;

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

function TipoFilter({ value, onChange }: { value: FiltroTipo; onChange: (v: FiltroTipo) => void }) {
  const { t } = useI18n();
  const opcoes: { id: FiltroTipo; label: TranslationKey }[] = [
    { id: "todos", label: "filter.status.all" },
    { id: "moto", label: "produto.tipo.moto" },
    { id: "bicicleta", label: "produto.tipo.bicicleta" },
  ];
  return (
    <div className="status-filter" role="group" aria-label={t("produto.tipo")}>
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

export default function ProdutosRelatorioPage({
  navReset,
  onNavigate,
}: {
  navReset: number;
  onNavigate: (v: "produtos") => void;
}) {
  const { t, locale } = useI18n();
  const { filial } = useFilial();
  const idFilial = useFilialId();
  const moedaOp = moedaOperacaoDe(filial?.moedaOperacao);
  const { cotacao } = useCotacaoHoje();
  const [itens, setItens] = useState<Produto[]>([]);
  const [search, setSearch] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("ativo");
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>("todos");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [folha, setFolha] = useState<FolhaRelatorio | null>(null);

  const resetLista = () => setSelected(null);
  useCrudReset(navReset, resetLista);

  async function carregar() {
    setErro(null);
    setCarregando(true);
    try {
      setItens(await listarProdutos(idFilial));
    } catch (e) {
      setErro(mensagemErroApi(e, t, "common.error.loadFailed"));
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { void carregar(); }, [idFilial]);

  const dinheiro = useCallback((p: Produto, campo: "precoLista" | "custo") => (
    converterMoeda(p[campo] ?? 0, p.moedaPreco ?? "usd", moedaOp, cotacao)
  ), [moedaOp, cotacao]);

  const tipoDe = useCallback((p: Produto) => (
    p.tipo === "moto" ? t("produto.tipo.moto") : t("produto.tipo.bicicleta")
  ), [t]);

  const q = search.trim().toLowerCase();
  const filtrados = useMemo(() => itens.filter((p) => {
    if (!passaFiltroStatus(p.status, filtroStatus)) return false;
    if (filtroTipo !== "todos" && p.tipo !== filtroTipo) return false;
    return `${p.codigo} ${p.nome} ${p.marca} ${p.modelo}`.toLowerCase().includes(q);
  }), [itens, filtroStatus, filtroTipo, q]);

  const sort = useListSort(filtrados, (p, k) => {
    if (k === "codigo") return p.codigo;
    if (k === "nome") return p.nome;
    if (k === "tipo") return tipoDe(p);
    if (k === "marca") return p.marca;
    if (k === "preco") return dinheiro(p, "precoLista");
    if (k === "custo") return dinheiro(p, "custo");
    if (k === "disponivel") return p.quantidadeDisponivel ?? 0;
    if (k === "status") return p.status;
    return p.id;
  }, "nome", "asc");

  useEffect(() => { setPage(1); }, [search, filtroStatus, filtroTipo, sort.sortKey, sort.sortDir]);

  const paged = slicePage(sort.items, page);
  const selecionado = itens.find((p) => p.id === selected) ?? null;
  const navIds = sort.items.map((p) => p.id);
  const navIndex = selected != null ? navIds.indexOf(selected) : -1;

  function linhaDe(p: Produto): string[] {
    return [
      p.codigo,
      p.nome,
      tipoDe(p),
      p.marca,
      formatMoeda(dinheiro(p, "precoLista"), moedaOp),
      formatMoeda(dinheiro(p, "custo"), moedaOp),
      `${p.quantidadeDisponivel ?? 0} ${t("estoque.unit")}`,
      p.status === "inativo" ? t("common.inactive") : t("common.active"),
    ];
  }

  function montarFolha(): FolhaRelatorio {
    const empresa = filial?.nome ?? "";
    const situacao = filtroStatus === "inativo" ? t("filter.status.inactive")
      : filtroStatus === "todos" ? t("filter.status.all")
        : t("filter.status.active");
    const tipo = filtroTipo === "moto" ? t("produto.tipo.moto")
      : filtroTipo === "bicicleta" ? t("produto.tipo.bicicleta")
        : "";
    const colunas = [
      t("col.code"), t("common.name"), t("produto.tipo"), t("produto.marca"),
      t("produto.listPrice"), t("produto.cost"), t("estoque.available"), t("common.status"),
    ];
    return {
      arquivo: "produtos",
      titulo: t("nav.relatorioProdutos"),
      empresa,
      filtro: tipo ? `${empresa} · ${situacao} · ${tipo}` : `${empresa} · ${situacao}`,
      emitidoEm: formatarDataHoraEpoch(Date.now(), locale === "es" ? "es-PY" : "pt-BR"),
      faixas: [],
      colunas,
      linhas: sort.items.map(linhaDe),
      direita: [4, 5, 6],
      rodapes: [{
        rotulo: tf(t, "relatorio.registros", { n: String(sort.items.length) }),
        celulas: ["", "", "", "", "", "", "", ""],
      }],
    };
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)", color: v("--text") }}>{t("nav.relatorioProdutos")}</h1>
      {erro && <p className="text-sm" style={{ color: "#ef4444" }}>{erro}</p>}
      <ListToolbar>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("relatorio.busca.produtos")}
          className="px-3 py-2 text-sm rounded-md outline-none w-72"
          style={{ background: v("--card"), border: border1(), color: v("--text") }}
        />
        <StatusFilter value={filtroStatus} onChange={setFiltroStatus} />
        <TipoFilter value={filtroTipo} onChange={setFiltroTipo} />
      </ListToolbar>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm" style={{ color: v("--text-muted") }}>
          {tf(t, "relatorio.registros", { n: String(sort.items.length) })}
        </span>
        <MenuExportar
          disabled={!sort.items.length || carregando}
          onPdf={() => setFolha(montarFolha())}
          onExcel={() => baixarPlanilha(montarFolha())}
        />
      </div>
      <div className="rounded-lg overflow-hidden" style={{ background: v("--card"), border: border1() }}>
        <table className="drive-table w-full">
          <thead>
            <TableHeadRow
              sortKey={sort.sortKey}
              sortDir={sort.sortDir}
              onSort={sort.onSort}
              cols={[
                { label: "col.code", sort: "codigo" },
                { label: "common.name", sort: "nome" },
                { label: "produto.tipo", sort: "tipo" },
                { label: "produto.marca", sort: "marca" },
                { label: "produto.listPrice", sort: "preco", align: "right" },
                { label: "produto.cost", sort: "custo", align: "right" },
                { label: "estoque.available", sort: "disponivel", align: "right" },
                { label: "common.status", sort: "status" },
              ]}
            />
          </thead>
          <tbody>
            {paged.slice.map((p) => {
              const sel = selected === p.id;
              const preco = formatMoeda(dinheiro(p, "precoLista"), moedaOp);
              const custo = formatMoeda(dinheiro(p, "custo"), moedaOp);
              const disponivel = `${p.quantidadeDisponivel ?? 0} ${t("estoque.unit")}`;
              return (
                <tr
                  key={p.id}
                  onClick={() => setSelected(sel ? null : p.id)}
                  className={`drive-row-clickable${sel ? " drive-row-selected" : ""}`}
                >
                  <Td mono gold>{p.codigo}</Td>
                  <td className="drive-td drive-td-clip text-[0.8125rem] font-medium" style={{ color: v("--text") }} title={p.nome}>{p.nome}</td>
                  <Td sub>{tipoDe(p)}</Td>
                  <Td sub clip title={p.marca}>{p.marca}</Td>
                  <Td mono right>{preco}</Td>
                  <Td mono right>{custo}</Td>
                  <Td mono right>{disponivel}</Td>
                  <td className="drive-td"><StatusTexto status={p.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {carregando && !itens.length && <div className="py-12 text-center text-sm" style={{ color: v("--text-muted") }}>{t("common.loading")}</div>}
        {!carregando && !sort.items.length && <div className="py-12 text-center text-sm" style={{ color: v("--text-muted") }}>{t("common.noRecords")}</div>}
        {sort.items.length > 0 && <TablePagination page={paged.pageSafe} total={paged.total} onPageChange={setPage} />}
      </div>

      {selecionado && (
        <ProdutoFicha
          id={selecionado.id}
          fallback={selecionado}
          nav={navIndex >= 0 && navIds.length > 1 ? {
            index: navIndex,
            total: navIds.length,
            onPrev: () => { const id = navIds[navIndex - 1]; if (id != null) setSelected(id); },
            onNext: () => { const id = navIds[navIndex + 1]; if (id != null) setSelected(id); },
          } : undefined}
          onClose={() => setSelected(null)}
          onEdit={() => onNavigate("produtos")}
          onChanged={carregar}
        />
      )}
      {folha && <RelatorioFolha folha={folha} onClose={() => setFolha(null)} />}
    </div>
  );
}
