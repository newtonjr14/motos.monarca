import { useCallback, useEffect, useState } from "react";
import { Field } from "@/components/crud/Field";
import { CatalogHeader, StatusBadge, TableHeadRow, TablePagination, Td } from "@/components/crud/ListUi";
import { useCrudReset } from "@/hooks/useCrudReset";
import { useI18n } from "@/i18n";
import { mensagemErroApi } from "@/i18n/apiMessages";
import { tf } from "@/i18n/format";
import {
  atualizarCotacao,
  avisarCotacaoMudou,
  criarCotacao,
  excluirCotacao,
  listarCotacoes,
  type Cotacao,
} from "@/api";
import { slicePage } from "@/format";

const v = (name: string) => `var(${name})`;

export function hojeAsuncion(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Asuncion",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export default function CotacoesPage({ navReset }: { navReset: number }) {
  const { t } = useI18n();
  const [itens, setItens] = useState<Cotacao[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [erro, setErro] = useState<string | null>(null);
  const [formAberto, setFormAberto] = useState(false);
  const [editando, setEditando] = useState<Cotacao | null>(null);
  const [data, setData] = useState(hojeAsuncion());
  const [usdPyg, setUsdPyg] = useState("");
  const [brlPyg, setBrlPyg] = useState("");
  const [status, setStatus] = useState<"ativo" | "inativo">("ativo");
  const [salvando, setSalvando] = useState(false);

  const resetLista = useCallback(() => {
    setFormAberto(false);
    setEditando(null);
  }, []);
  useCrudReset(navReset, resetLista);

  async function carregar() {
    try {
      setErro(null);
      setItens(await listarCotacoes());
    } catch (e) {
      setErro(mensagemErroApi(e, t, "common.error.loadFailed"));
    }
  }
  useEffect(() => { void carregar(); }, []);
  useEffect(() => { setPage(1); }, [search]);

  function abrir(item?: Cotacao) {
    setEditando(item ?? null);
    setData(item?.data ?? hojeAsuncion());
    setUsdPyg(item ? String(item.usdPyg) : "");
    setBrlPyg(item ? String(item.brlPyg) : "");
    setStatus(item?.status === "inativo" ? "inativo" : "ativo");
    setErro(null);
    setFormAberto(true);
  }

  async function salvar() {
    setErro(null);
    const usd = Number(usdPyg.replace(",", "."));
    const brl = Number(brlPyg.replace(",", "."));
    if (!data.trim()) {
      setErro(t("cotacao.error.required"));
      return;
    }
    if (!Number.isFinite(usd) || usd <= 0 || !Number.isFinite(brl) || brl <= 0) {
      setErro(t("cotacao.error.rate"));
      return;
    }
    setSalvando(true);
    try {
      const body = { data: data.trim(), usdPyg: usd, brlPyg: brl, status };
      if (editando) await atualizarCotacao(editando.id, body);
      else await criarCotacao(body);
      avisarCotacaoMudou();
      setFormAberto(false);
      await carregar();
    } catch (e) {
      setErro(mensagemErroApi(e, t, "common.error.saveFailed"));
    } finally {
      setSalvando(false);
    }
  }

  if (formAberto) {
    return (
      <div className="space-y-5 max-w-xl">
        <button type="button" className="text-xs cursor-pointer" style={{ color: v("--text-muted") }} onClick={() => setFormAberto(false)}>
          ← {t("common.back")}
        </button>
        <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)", color: v("--text") }}>
          {editando ? t("cotacao.edit") : t("cotacao.new")}
        </h1>
        <form className="rounded-lg p-6 space-y-4" style={{ background: v("--card"), border: `1px solid ${v("--border")}` }}
          onSubmit={(e) => { e.preventDefault(); void salvar(); }}>
          {erro && <p className="text-sm" style={{ color: "#ef4444" }}>{erro}</p>}
          <Field label={t("cotacao.date")} required hint={t("cotacao.dateHint")}>
            <input className="field font-mono" type="date" autoFocus readOnly={!!editando} value={data} onChange={(e) => setData(e.target.value)} />
          </Field>
          <Field label={t("cotacao.usdPyg")} required hint={t("cotacao.usdPygHint")}>
            <input className="field font-mono" inputMode="decimal" value={usdPyg} onChange={(e) => setUsdPyg(e.target.value)} />
          </Field>
          <Field label={t("cotacao.brlPyg")} required hint={t("cotacao.brlPygHint")}>
            <input className="field font-mono" inputMode="decimal" value={brlPyg} onChange={(e) => setBrlPyg(e.target.value)} />
          </Field>
          {editando && (
            <Field label={t("common.status")}>
              <select className="field" value={status} onChange={(e) => setStatus(e.target.value as "ativo" | "inativo")}>
                <option value="ativo">{t("common.active")}</option>
                <option value="inativo">{t("common.inactive")}</option>
              </select>
            </Field>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost px-4 py-2 text-sm" onClick={() => setFormAberto(false)}>{t("common.cancel")}</button>
            <button type="submit" disabled={salvando} className="btn-gold px-5 py-2 text-sm">{salvando ? t("common.saving") : t("common.save")}</button>
          </div>
        </form>
      </div>
    );
  }

  const filtered = itens.filter((e) => `${e.data} ${e.usdPyg} ${e.brlPyg}`.includes(search.toLowerCase()));
  const paged = slicePage(filtered, page);

  return (
    <div className="space-y-5">
      <CatalogHeader titulo={t("nav.cotacoes")} count={itens.length} novoLabel={t("cotacao.new")} onNovo={() => abrir()} />
      {erro && <p className="text-sm" style={{ color: "#ef4444" }}>{erro}</p>}
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("common.search")}
        className="px-3 py-2 text-sm rounded-md outline-none w-64"
        style={{ background: v("--card"), border: `1px solid ${v("--border")}`, color: v("--text") }} />
      <div className="rounded-lg overflow-hidden" style={{ background: v("--card"), border: `1px solid ${v("--border")}` }}>
        <table className="drive-table w-full">
          <thead>
            <TableHeadRow cols={["col.id", "cotacao.date", "cotacao.usdPyg", "cotacao.brlPyg", "common.status", ""]} />
          </thead>
          <tbody>
            {paged.slice.map((e) => (
              <tr
                key={e.id}
                className="drive-row-clickable"
                style={{ borderBottom: `1px solid ${v("--border")}` }}
                onClick={() => abrir(e)}
              >
                <Td mono gold>{e.id}</Td>
                <Td mono>{e.data}</Td>
                <Td mono>{e.usdPyg}</Td>
                <Td mono>{e.brlPyg}</Td>
                <td className="px-4 py-3"><StatusBadge status={e.status === "inativo" ? "inativo" : "ativo"} /></td>
                <td className="px-4 py-3 text-right">
                  <button className="text-xs cursor-pointer mr-3" style={{ color: v("--gold") }} onClick={(ev) => { ev.stopPropagation(); abrir(e); }}>{t("common.edit")}</button>
                  <button className="text-xs cursor-pointer" style={{ color: "var(--danger)" }}
                    onClick={async (ev) => {
                      ev.stopPropagation();
                      if (!confirm(tf(t, "common.confirmDelete", { name: e.data }))) return;
                      try { await excluirCotacao(e.id); avisarCotacaoMudou(); await carregar(); }
                      catch (err) { setErro(mensagemErroApi(err, t, "common.error.deleteFailed")); }
                    }}>{t("common.delete")}</button>
                </td>
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
