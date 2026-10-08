import { useCallback, useEffect, useState } from "react";
import { TableHeadRow, TablePagination, Td, useListSort } from "@/components/crud/ListUi";
import VendaFicha from "@/components/VendaFicha";
import { useCrudReset } from "@/hooks/useCrudReset";
import { useI18n, type TranslationKey } from "@/i18n";
import { mensagemErroApi } from "@/i18n/apiMessages";
import { tf } from "@/i18n/format";
import { useFilialId } from "@/auth/FilialContext";
import { cancelarVenda, listarVendas, type Venda } from "@/api";
import { dataAsuncion, formatarDataEpoch, formatPyg, slicePage } from "@/format";

const v = (name: string) => `var(${name})`;
const border1 = () => `1px solid ${v("--border")}`;

function rotuloStatus(status: string, validade: string | null | undefined): TranslationKey {
  if (status === "cancelada") return "venda.status.cancelada";
  if (status === "aberta") return "venda.status.aberta";
  if (status === "orcamento") {
    return validade && validade < dataAsuncion() ? "venda.status.orcamentoVencido" : "venda.status.orcamento";
  }
  if (status === "utilizada") return "venda.status.utilizada";
  return "venda.status.finalizada";
}

type FiltroVenda = "todos" | "aberta" | "orcamento" | "finalizada" | "cancelada" | "utilizada";

function Segmentos({ value, onChange }: { value: FiltroVenda; onChange: (v: FiltroVenda) => void }) {
  const { t } = useI18n();
  const opcoes: { id: FiltroVenda; label: TranslationKey }[] = [
    { id: "todos", label: "venda.filtro.todos" },
    { id: "aberta", label: "venda.filtro.aberta" },
    { id: "orcamento", label: "venda.filtro.orcamento" },
    { id: "finalizada", label: "venda.filtro.finalizada" },
    { id: "cancelada", label: "venda.filtro.cancelada" },
    { id: "utilizada", label: "venda.filtro.utilizada" },
  ];
  return (
    <div className="status-filter" role="group" aria-label={t("col.status")}>
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

export default function HistoricoVendasPage({
  navReset,
  onContinuar,
  onGerarVenda,
}: {
  navReset: number;
  onContinuar: (id: number) => void;
  onGerarVenda: (ids: number[], confirmarVencido: boolean) => void;
}) {
  const { t, locale } = useI18n();
  const idFilial = useFilialId();
  const [itens, setItens] = useState<Venda[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [erro, setErro] = useState<string | null>(null);
  const [fichaId, setFichaId] = useState<number | null>(null);
  const [filtro, setFiltro] = useState<FiltroVenda>("todos");
  const [selecionados, setSelecionados] = useState<number[]>([]);

  const resetLista = useCallback(() => { setFichaId(null); }, []);
  useCrudReset(navReset, resetLista);

  async function carregar() {
    try {
      setErro(null);
      setItens(await listarVendas(idFilial));
    } catch (e) {
      setErro(mensagemErroApi(e, t, "common.error.loadFailed"));
    }
  }
  useEffect(() => { void carregar(); }, [idFilial]);
  const filtered = itens.filter((e) => {
    if (filtro !== "todos" && e.status !== filtro) return false;
    const data = formatarDataEpoch(e.criadoEm);
    return `${e.id} ${e.clienteNome} ${e.vendedorNome} ${data}`.toLowerCase().includes(search.toLowerCase());
  });
  const { items: ordenados, sortKey, sortDir, onSort } = useListSort(filtered, (e, k) => {
    if (k === "data") return e.criadoEm;
    if (k === "cliente") return e.clienteNome;
    if (k === "total") return e.totalPyg;
    if (k === "vendedor") return e.vendedorNome;
    return e.id;
  }, "data", "desc");
  useEffect(() => { setPage(1); }, [search, sortKey, sortDir, filtro]);

  function alternarSelecao(id: number) {
    setSelecionados((atual) => atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id]);
  }

  function gerarVenda() {
    const escolhidos = itens.filter((e) => selecionados.includes(e.id) && e.status === "orcamento");
    if (!escolhidos.length) return;
    const clienteId = escolhidos[0]!.idCliente;
    if (escolhidos.some((e) => e.idCliente !== clienteId)) {
      setErro(t("venda.orcamentoCliente"));
      return;
    }
    const vencido = escolhidos.some((e) => e.validade != null && e.validade < dataAsuncion());
    if (vencido && !window.confirm(t("venda.confirmVencido"))) return;
    setSelecionados([]);
    setFichaId(null);
    onGerarVenda(escolhidos.map((e) => e.id), vencido);
  }

  async function cancelar(id: number) {
    if (!window.confirm(t("venda.confirmCancelar"))) return;
    try {
      setErro(null);
      await cancelarVenda(id);
      setFichaId(null);
      setSelecionados((atual) => atual.filter((x) => x !== id));
      await carregar();
    } catch (e) {
      setErro(mensagemErroApi(e, t, "common.error.saveFailed"));
    }
  }

  const fichaIndex = fichaId != null ? ordenados.findIndex((e) => e.id === fichaId) : -1;
  const ficha = fichaIndex >= 0 ? ordenados[fichaIndex] : null;
  useEffect(() => {
    if (fichaId != null && fichaIndex < 0) setFichaId(null);
  }, [fichaId, fichaIndex]);

  const paged = slicePage(ordenados, page);
  const dataHoraFmt = new Intl.DateTimeFormat(locale === "es" ? "es-PY" : "pt-BR", {
    timeZone: "America/Asuncion",
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)", color: v("--text") }}>{t("nav.historico")}</h1>
      {erro && <p className="text-sm" style={{ color: "#ef4444" }}>{erro}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <Segmentos value={filtro} onChange={setFiltro} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("venda.searchPlaceholder")}
          className="px-3 py-2 text-sm rounded-md outline-none w-64"
          style={{ background: v("--card"), border: border1(), color: v("--text") }} />
        {selecionados.length > 0 && (
          <button type="button" className="btn-gold px-3 py-2 text-sm" onClick={gerarVenda}>
            {t("venda.gerarVenda")} · {tf(t, "venda.orcamentosSelecionados", { n: String(selecionados.length) })}
          </button>
        )}
      </div>
      <div className="rounded-lg overflow-hidden" style={{ background: v("--card"), border: border1() }}>
        <table className="drive-table w-full">
          <thead>
            <TableHeadRow
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={onSort}
              cols={[
                { label: "" },
                { label: "col.id", sort: "id" },
                { label: "col.date", sort: "data" },
                { label: "venda.client", sort: "cliente" },
                { label: "venda.total", sort: "total" },
                { label: "venda.seller", sort: "vendedor" },
                { label: "col.status" },
              ]}
            />
          </thead>
          <tbody>
            {paged.slice.map((e) => (
              <tr key={e.id} className="drive-row-clickable" style={{ borderBottom: border1() }}
                onClick={() => setFichaId(e.id)} title={dataHoraFmt.format(e.criadoEm)}>
                <td className="drive-td" onClick={(ev) => ev.stopPropagation()}>
                  {e.status === "orcamento" && (
                    <input
                      type="checkbox"
                      checked={selecionados.includes(e.id)}
                      aria-label={t("venda.gerarVenda")}
                      onChange={() => alternarSelecao(e.id)}
                    />
                  )}
                </td>
                <Td mono gold>{e.id}</Td>
                <Td mono>{formatarDataEpoch(e.criadoEm)}</Td>
                <Td>{e.clienteNome}</Td>
                <Td mono>Gs. {formatPyg(e.totalPyg)}</Td>
                <Td>{e.vendedorNome}</Td>
                <Td>{t(rotuloStatus(e.status, e.validade))}</Td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && <div className="py-12 text-center text-sm" style={{ color: v("--text-muted") }}>{t("common.noRecords")}</div>}
        {filtered.length > 0 && <TablePagination page={paged.pageSafe} total={paged.total} onPageChange={setPage} />}
      </div>
      {ficha && (
        <VendaFicha
          item={ficha}
          nav={ordenados.length > 1 ? {
            index: fichaIndex,
            total: ordenados.length,
            onPrev: () => { const prev = ordenados[fichaIndex - 1]; if (prev) setFichaId(prev.id); },
            onNext: () => { const next = ordenados[fichaIndex + 1]; if (next) setFichaId(next.id); },
          } : undefined}
          onContinuar={(id) => { setFichaId(null); onContinuar(id); }}
          onGerarVenda={(id) => {
            const doc = itens.find((e) => e.id === id);
            const vencido = !!doc?.validade && doc.validade < dataAsuncion();
            if (vencido && !window.confirm(t("venda.confirmVencido"))) return;
            setFichaId(null);
            setSelecionados([]);
            onGerarVenda([id], vencido);
          }}
          onCancelar={(id) => { void cancelar(id); }}
          onClose={() => setFichaId(null)}
        />
      )}
    </div>
  );
}
