import { useCallback, useEffect, useState } from "react";
import { Field } from "@/components/crud/Field";
import { CatalogHeader, ListToolbar, TableHeadRow, TablePagination, Td, useListSort } from "@/components/crud/ListUi";
import FacturaFicha from "@/components/FacturaFicha";
import { useCrudReset } from "@/hooks/useCrudReset";
import { useI18n } from "@/i18n";
import type { TranslationKey } from "@/i18n";
import { mensagemErroApi } from "@/i18n/apiMessages";
import { useFilialId } from "@/auth/FilialContext";
import {
  buscarFactura,
  emitirFactura,
  listarFacturas,
  listarVendasElegiveisFactura,
  type Factura,
  type FacturaResumo,
  type VendaElegivelFactura,
} from "@/api";
import { formatPyg, formatarDataHoraEpoch, slicePage } from "@/format";

const v = (name: string) => `var(${name})`;

function estadoKey(estado: string): TranslationKey {
  return `factura.estado.${estado}` as TranslationKey;
}

export default function FacturasPage({ navReset }: { navReset: number }) {
  const { t } = useI18n();
  const idFilial = useFilialId();
  const [itens, setItens] = useState<FacturaResumo[]>([]);
  const [elegiveis, setElegiveis] = useState<VendaElegivelFactura[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [erro, setErro] = useState<string | null>(null);
  const [formAberto, setFormAberto] = useState(false);
  const [detalhe, setDetalhe] = useState<Factura | null>(null);
  const [idVenda, setIdVenda] = useState<number | "">("");
  const [enviarAposCriar, setEnviarAposCriar] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const resetLista = useCallback(() => {
    setFormAberto(false);
    setDetalhe(null);
    setIdVenda("");
  }, []);
  useCrudReset(navReset, resetLista);

  async function carregar() {
    try {
      setErro(null);
      const [facts, vendas] = await Promise.all([
        listarFacturas(idFilial),
        listarVendasElegiveisFactura(idFilial),
      ]);
      setItens(facts);
      setElegiveis(vendas);
    } catch (e) {
      setErro(mensagemErroApi(e, t, "common.error.loadFailed"));
    }
  }
  useEffect(() => { void carregar(); }, [idFilial]);

  const filtered = itens.filter((e) =>
    `${e.clienteNome} ${e.referencia} ${e.cdc ?? ""} ${e.estado} ${e.idVenda}`.toLowerCase().includes(search.toLowerCase()));
  const { items: ordenados, sortKey, sortDir, onSort } = useListSort(filtered, (e, k) => {
    if (k === "cliente") return e.clienteNome;
    if (k === "estado") return e.estado;
    if (k === "total") return e.totalPyg;
    if (k === "venda") return e.idVenda;
    return e.criadoEm;
  }, "criadoEm", "desc");
  useEffect(() => { setPage(1); }, [search, sortKey, sortDir]);
  const paged = slicePage(ordenados, page);
  const navIndex = detalhe ? ordenados.findIndex((e) => e.id === detalhe.id) : -1;

  function abrirNovo() {
    setErro(null);
    setIdVenda("");
    setEnviarAposCriar(true);
    setFormAberto(true);
  }

  async function abrirDetalhe(id: number) {
    try {
      setErro(null);
      setDetalhe(await buscarFactura(id));
    } catch (e) {
      setErro(mensagemErroApi(e, t, "common.error.loadFailed"));
    }
  }

  async function emitir(e: React.FormEvent) {
    e.preventDefault();
    if (idVenda === "") {
      setErro(t("factura.error.vendaObrigatoria"));
      return;
    }
    setSalvando(true);
    setErro(null);
    try {
      const f = await emitirFactura({ idVenda: Number(idVenda), enviar: enviarAposCriar });
      setFormAberto(false);
      setIdVenda("");
      await carregar();
      setDetalhe(f);
    } catch (err) {
      setErro(mensagemErroApi(err, t, "common.error.saveFailed"));
    } finally {
      setSalvando(false);
    }
  }

  if (formAberto) {
    return (
      <div className="max-w-xl space-y-4">
        <button type="button" className="text-sm" style={{ color: v("--gold") }} onClick={() => setFormAberto(false)}>
          ← {t("common.back")}
        </button>
        <form
          className="rounded-lg p-5 space-y-4"
          style={{ background: v("--card"), border: `1px solid ${v("--border")}` }}
          onSubmit={(ev) => void emitir(ev)}
        >
          <h2 className="text-lg font-semibold" style={{ color: v("--text") }}>{t("factura.emitir")}</h2>
          {erro && <p className="text-sm" style={{ color: "#ef4444" }}>{erro}</p>}
          <Field label={t("factura.escolherVenda")} required>
            <select
              className="field"
              value={idVenda === "" ? "" : String(idVenda)}
              onChange={(ev) => setIdVenda(ev.target.value ? Number(ev.target.value) : "")}
            >
              <option value="">{t("factura.selecioneVenda")}</option>
              {elegiveis.map((vda) => (
                <option key={vda.id} value={vda.id}>
                  #{vda.id} — {vda.clienteNome} — {formatPyg(vda.totalPyg)}
                </option>
              ))}
            </select>
          </Field>
          {elegiveis.length === 0 && (
            <p className="text-sm" style={{ color: v("--text-muted") }}>{t("factura.semVendasElegiveis")}</p>
          )}
          <label className="flex items-center gap-2 text-sm" style={{ color: v("--text") }}>
            <input
              type="checkbox"
              className="field"
              checked={enviarAposCriar}
              onChange={(ev) => setEnviarAposCriar(ev.target.checked)}
            />
            {t("factura.enviarAposCriar")}
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost px-4 py-2" onClick={() => setFormAberto(false)}>{t("common.cancel")}</button>
            <button type="submit" className="btn-gold px-4 py-2" disabled={salvando || elegiveis.length === 0}>
              {salvando ? t("common.loading") : t("factura.emitir")}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <CatalogHeader titulo={t("nav.facturas")} novoLabel={t("factura.emitir")} onNovo={abrirNovo} />
      {erro && <p className="text-sm" style={{ color: "#ef4444" }}>{erro}</p>}
      <ListToolbar>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("factura.searchPlaceholder")}
          className="px-3 py-2 text-sm rounded-md outline-none w-64"
          style={{ background: v("--card"), border: `1px solid ${v("--border")}`, color: v("--text") }}
        />
      </ListToolbar>
      <div className="rounded-lg overflow-hidden" style={{ background: v("--card"), border: `1px solid ${v("--border")}` }}>
        <table className="drive-table w-full">
          <thead>
            <TableHeadRow
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={onSort}
              cols={[
                { label: "factura.venda", sort: "venda" },
                { label: "factura.cliente", sort: "cliente" },
                { label: "factura.estado", sort: "estado" },
                { label: "factura.cdc" },
                { label: "factura.total", sort: "total" },
                { label: "factura.data", sort: "criadoEm" },
              ]}
            />
          </thead>
          <tbody>
            {paged.slice.map((row) => (
              <tr key={row.id} className="drive-row-clickable" onClick={() => void abrirDetalhe(row.id)}>
                <Td>#{row.idVenda}</Td>
                <Td>{row.clienteNome}</Td>
                <Td>{t(estadoKey(row.estado))}</Td>
                <Td mono sub title={row.cdc ?? undefined}>
                  {row.cdc ? `${row.cdc.slice(0, 12)}…` : "—"}
                </Td>
                <Td mono right>{formatPyg(row.totalPyg)}</Td>
                <Td sub>{formatarDataHoraEpoch(row.criadoEm)}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TablePagination page={page} total={ordenados.length} onPageChange={setPage} />
      {detalhe && (
        <FacturaFicha
          item={detalhe}
          nav={navIndex >= 0 ? {
            index: navIndex,
            total: ordenados.length,
            onPrev: () => { const prev = ordenados[navIndex - 1]; if (prev) void abrirDetalhe(prev.id); },
            onNext: () => { const next = ordenados[navIndex + 1]; if (next) void abrirDetalhe(next.id); },
          } : undefined}
          onClose={() => setDetalhe(null)}
          onAtualizado={(f) => {
            setDetalhe(f);
            void carregar();
          }}
        />
      )}
    </div>
  );
}
