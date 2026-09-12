import { useCallback, useEffect, useState } from "react";
import { TableHeadRow, TablePagination, Td, useListSort } from "@/components/crud/ListUi";
import VendaFicha from "@/components/VendaFicha";
import { useCrudReset } from "@/hooks/useCrudReset";
import { useI18n } from "@/i18n";
import { mensagemErroApi } from "@/i18n/apiMessages";
import { useFilialId } from "@/auth/FilialContext";
import { listarVendas, type Venda } from "@/api";
import { formatarDataEpoch, formatPyg, slicePage } from "@/format";

const v = (name: string) => `var(${name})`;
const border1 = () => `1px solid ${v("--border")}`;

export default function HistoricoVendasPage({ navReset }: { navReset: number }) {
  const { t, locale } = useI18n();
  const idFilial = useFilialId();
  const [itens, setItens] = useState<Venda[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [erro, setErro] = useState<string | null>(null);
  const [fichaId, setFichaId] = useState<number | null>(null);

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
  useEffect(() => { setPage(1); }, [search, sortKey, sortDir]);

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
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("venda.searchPlaceholder")}
        className="px-3 py-2 text-sm rounded-md outline-none w-64"
        style={{ background: v("--card"), border: border1(), color: v("--text") }} />
      <div className="rounded-lg overflow-hidden" style={{ background: v("--card"), border: border1() }}>
        <table className="drive-table w-full">
          <thead>
            <TableHeadRow
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={onSort}
              cols={[
                { label: "col.id", sort: "id" },
                { label: "col.date", sort: "data" },
                { label: "venda.client", sort: "cliente" },
                { label: "venda.total", sort: "total" },
                { label: "venda.seller", sort: "vendedor" },
              ]}
            />
          </thead>
          <tbody>
            {paged.slice.map((e) => (
              <tr key={e.id} className="drive-row-clickable" style={{ borderBottom: border1() }}
                onClick={() => setFichaId(e.id)} title={dataHoraFmt.format(e.criadoEm)}>
                <Td mono gold>{e.id}</Td>
                <Td mono>{formatarDataEpoch(e.criadoEm)}</Td>
                <Td>{e.clienteNome}</Td>
                <Td mono>Gs. {formatPyg(e.totalPyg)}</Td>
                <Td>{e.vendedorNome}</Td>
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
          onClose={() => setFichaId(null)}
        />
      )}
    </div>
  );
}
