import { useCallback, useEffect, useState } from "react";
import { TableHeadRow, TablePagination, Td, useListSort } from "@/components/crud/ListUi";
import { useCrudReset } from "@/hooks/useCrudReset";
import { useI18n } from "@/i18n";
import { mensagemErroApi } from "@/i18n/apiMessages";
import { useFilialId } from "@/auth/FilialContext";
import { listarVendas, type Venda } from "@/api";
import { formatMoeda, formatPyg, slicePage } from "@/format";

const v = (name: string) => `var(${name})`;
const border1 = () => `1px solid ${v("--border")}`;

export default function HistoricoVendasPage({ navReset }: { navReset: number }) {
  const { t, locale } = useI18n();
  const idFilial = useFilialId();
  const [itens, setItens] = useState<Venda[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [erro, setErro] = useState<string | null>(null);
  const [vendo, setVendo] = useState<Venda | null>(null);

  const resetLista = useCallback(() => { setVendo(null); }, []);
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
  const filtered = itens.filter((e) => `${e.id} ${e.clienteNome} ${e.vendedorNome}`.toLowerCase().includes(search.toLowerCase()));
  const { items: ordenados, sortKey, sortDir, onSort } = useListSort(filtered, (e, k) => {
    if (k === "cliente") return e.clienteNome;
    if (k === "total") return e.totalPyg;
    if (k === "vendedor") return e.vendedorNome;
    return e.id;
  });
  useEffect(() => { setPage(1); }, [search, sortKey, sortDir]);

  if (vendo) {
    return (
      <div className="space-y-5 max-w-5xl">
        <button type="button" className="text-xs cursor-pointer" style={{ color: v("--text-muted") }} onClick={() => setVendo(null)}>
          ← {t("common.back")}
        </button>
        <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)", color: v("--text") }}>
          {t("venda.view")} #{vendo.id}
        </h1>
        <div className="rounded-lg p-6 space-y-4" style={{ background: v("--card"), border: border1() }}>
          <p className="text-sm" style={{ color: v("--text-sub") }}>{vendo.clienteNome} · {vendo.vendedorNome}</p>
          <p className="text-sm font-mono" style={{ color: v("--gold") }}>Gs. {formatPyg(vendo.totalPyg)}</p>
          <table className="drive-table w-full">
            <thead>
              <TableHeadRow cols={["col.code", "common.name", "venda.qty", "venda.total"]} />
            </thead>
            <tbody>
              {vendo.itens.map((i) => (
                <tr key={i.id} style={{ borderBottom: border1() }}>
                  <Td mono>{i.produtoCodigo}</Td>
                  <Td>{i.produtoNome}</Td>
                  <Td mono>{i.quantidade}</Td>
                  <Td mono>Gs. {formatPyg(i.totalPyg)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-sm" style={{ color: v("--text-muted") }}>
            {vendo.negociacao.map((n) => `${n.finalizadorNome} ${formatMoeda(n.valor, n.moeda ?? "pyg")}`).join(" · ")}
          </p>
        </div>
      </div>
    );
  }

  const paged = slicePage(ordenados, page);
  const dataFmt = new Intl.DateTimeFormat(locale === "es" ? "es-PY" : "pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)", color: v("--text") }}>{t("nav.historico")}</h1>
        <p className="text-sm mt-0.5" style={{ color: v("--text-muted") }}>{itens.length} {t("common.registered")}</p>
      </div>
      {erro && <p className="text-sm" style={{ color: "#ef4444" }}>{erro}</p>}
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("common.search")}
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
                { label: "venda.client", sort: "cliente" },
                { label: "venda.total", sort: "total" },
                { label: "venda.seller", sort: "vendedor" },
              ]}
            />
          </thead>
          <tbody>
            {paged.slice.map((e) => (
              <tr key={e.id} className="drive-row-clickable" style={{ borderBottom: border1() }}
                onClick={() => setVendo(e)} title={dataFmt.format(e.criadoEm)}>
                <Td mono gold>{e.id}</Td>
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
    </div>
  );
}
