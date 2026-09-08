import { useCallback, useEffect, useState } from "react";
import { Field } from "@/components/crud/Field";
import { CatalogHeader, StatusBadge, TableHeadRow, TablePagination, Td } from "@/components/crud/ListUi";
import { useCrudReset } from "@/hooks/useCrudReset";
import { useI18n } from "@/i18n";
import type { TranslationKey } from "@/i18n";
import { mensagemErroApi } from "@/i18n/apiMessages";
import { tf } from "@/i18n/format";
import {
  atualizarFinalizador,
  criarFinalizador,
  excluirFinalizador,
  listarFinalizadores,
  type Finalizador,
  type TipoFinalizador,
} from "@/api";
import { slicePage, toTitleCase } from "@/format";

const v = (name: string) => `var(${name})`;
const TIPOS: TipoFinalizador[] = ["dinheiro", "cartao", "deposito", "cheque", "outro"];

export default function FinalizadoresPage({ navReset }: { navReset: number }) {
  const { t } = useI18n();
  const [itens, setItens] = useState<Finalizador[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [erro, setErro] = useState<string | null>(null);
  const [formAberto, setFormAberto] = useState(false);
  const [editando, setEditando] = useState<Finalizador | null>(null);
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<TipoFinalizador>("dinheiro");
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
      setItens(await listarFinalizadores());
    } catch (e) {
      setErro(mensagemErroApi(e, t, "common.error.loadFailed"));
    }
  }
  useEffect(() => { void carregar(); }, []);
  useEffect(() => { setPage(1); }, [search]);

  function abrir(item?: Finalizador) {
    setEditando(item ?? null);
    setNome(item?.nome ?? "");
    setTipo(item?.tipo ?? "dinheiro");
    setStatus(item?.status === "inativo" ? "inativo" : "ativo");
    setErro(null);
    setFormAberto(true);
  }

  async function salvar() {
    setErro(null);
    if (!nome.trim()) {
      setErro(t("finalizador.error.nameRequired"));
      return;
    }
    setSalvando(true);
    try {
      const body = { nome: toTitleCase(nome), tipo, status };
      if (editando) await atualizarFinalizador(editando.id, body);
      else await criarFinalizador(body);
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
          {editando ? t("finalizador.edit") : t("finalizador.new")}
        </h1>
        <form className="rounded-lg p-6 space-y-4" style={{ background: v("--card"), border: `1px solid ${v("--border")}` }}
          onSubmit={(e) => { e.preventDefault(); void salvar(); }}>
          {erro && <p className="text-sm" style={{ color: "#ef4444" }}>{erro}</p>}
          <Field label={t("common.name")} required>
            <input className="field" autoFocus value={nome} onChange={(e) => setNome(e.target.value)}
              onBlur={() => setNome((x) => toTitleCase(x))} />
          </Field>
          <Field label={t("finalizador.type")} required>
            <select className="field" value={tipo} onChange={(e) => setTipo(e.target.value as TipoFinalizador)}>
              {TIPOS.map((tp) => <option key={tp} value={tp}>{t(`finalizador.tipo.${tp}` as TranslationKey)}</option>)}
            </select>
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

  const filtered = itens.filter((e) => `${e.nome} ${e.tipo}`.toLowerCase().includes(search.toLowerCase()));
  const paged = slicePage(filtered, page);

  return (
    <div className="space-y-5">
      <CatalogHeader titulo={t("nav.finalizadores")} count={itens.length} novoLabel={t("finalizador.new")} onNovo={() => abrir()} />
      {erro && <p className="text-sm" style={{ color: "#ef4444" }}>{erro}</p>}
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("common.search")}
        className="px-3 py-2 text-sm rounded-md outline-none w-64"
        style={{ background: v("--card"), border: `1px solid ${v("--border")}`, color: v("--text") }} />
      <div className="rounded-lg overflow-hidden" style={{ background: v("--card"), border: `1px solid ${v("--border")}` }}>
        <table className="drive-table w-full">
          <thead>
            <TableHeadRow cols={["col.id", "common.name", "finalizador.type", "common.status", ""]} />
          </thead>
          <tbody>
            {paged.slice.map((e) => (
              <tr key={e.id} className="drive-row-clickable" style={{ borderBottom: `1px solid ${v("--border")}` }} onClick={() => abrir(e)}>
                <Td mono gold>{e.id}</Td>
                <Td>{e.nome}</Td>
                <Td>{t(`finalizador.tipo.${e.tipo}` as TranslationKey)}</Td>
                <td className="px-4 py-3"><StatusBadge status={e.status === "inativo" ? "inativo" : "ativo"} /></td>
                <td className="px-4 py-3 text-right">
                  <button className="text-xs cursor-pointer mr-3" style={{ color: v("--gold") }} onClick={(ev) => { ev.stopPropagation(); abrir(e); }}>{t("common.edit")}</button>
                  <button className="text-xs cursor-pointer" style={{ color: "var(--danger)" }}
                    onClick={async (ev) => {
                      ev.stopPropagation();
                      if (!confirm(tf(t, "common.confirmDelete", { name: e.nome }))) return;
                      try { await excluirFinalizador(e.id); await carregar(); }
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
