import { useCallback, useEffect, useState } from "react";
import { Field, Section } from "@/components/crud/Field";
import { CatalogHeader, ListToolbar, StatusBadge, StatusFilter, TableHeadRow, TablePagination, Td, passaFiltroStatus, useAlternarStatus, useListSort, type FiltroStatus } from "@/components/crud/ListUi";
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

function Chip({ label }: { label: string }) {
  return (
    <span
      className="text-[10px] px-1.5 py-0.5 rounded border font-medium"
      style={{ color: v("--gold"), borderColor: v("--gold-border"), background: v("--gold-bg") }}
    >
      {label}
    </span>
  );
}

export default function FinalizadoresPage({ navReset }: { navReset: number }) {
  const { t } = useI18n();
  const [itens, setItens] = useState<Finalizador[]>([]);
  const [search, setSearch] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("todos");
  const [page, setPage] = useState(1);
  const [erro, setErro] = useState<string | null>(null);
  const [formAberto, setFormAberto] = useState(false);
  const [editando, setEditando] = useState<Finalizador | null>(null);
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<TipoFinalizador>("dinheiro");
  const [geraReceber, setGeraReceber] = useState(false);
  const [geraPagar, setGeraPagar] = useState(false);
  const [fundoTroco, setFundoTroco] = useState(false);
  const [permiteAvulso, setPermiteAvulso] = useState(false);
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
  const { statusBusyId, alternar } = useAlternarStatus(
    setItens,
    (item, proximo) => atualizarFinalizador(item.id, {
      nome: item.nome,
      tipo: item.tipo,
      geraContasReceber: item.geraContasReceber ?? false,
      geraContasPagar: item.geraContasPagar ?? false,
      fundoTroco: item.fundoTroco ?? false,
      permiteLancamentoAvulso: item.permiteLancamentoAvulso ?? false,
      status: proximo,
    }),
    (e) => setErro(mensagemErroApi(e, t, "common.error.saveFailed")),
    carregar,
  );
  const filtered = itens.filter((e) =>
    passaFiltroStatus(e.status, filtroStatus) && `${e.nome} ${e.tipo}`.toLowerCase().includes(search.toLowerCase()));
  const { items: ordenados, sortKey, sortDir, onSort } = useListSort(filtered, (e, k) => {
    if (k === "nome") return e.nome;
    if (k === "tipo") return e.tipo;
    return e.id;
  });
  useEffect(() => { setPage(1); }, [search, filtroStatus, sortKey, sortDir]);

  function abrir(item?: Finalizador) {
    setEditando(item ?? null);
    setNome(item?.nome ?? "");
    const tipoIni = item?.tipo ?? "dinheiro";
    setTipo(tipoIni);
    setGeraReceber(item?.geraContasReceber ?? false);
    setGeraPagar(item?.geraContasPagar ?? false);
    setFundoTroco(item?.fundoTroco ?? (!item && tipoIni === "dinheiro"));
    setPermiteAvulso(item?.permiteLancamentoAvulso ?? (!item && tipoIni === "dinheiro"));
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
      const body = {
        nome: toTitleCase(nome),
        tipo,
        geraContasReceber: geraReceber,
        geraContasPagar: geraPagar,
        fundoTroco,
        permiteLancamentoAvulso: permiteAvulso,
        status,
      };
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
            <select className="field" value={tipo} onChange={(e) => {
              const next = e.target.value as TipoFinalizador;
              setTipo(next);
              if (!editando && next === "dinheiro") {
                setFundoTroco(true);
                setPermiteAvulso(true);
              }
            }}>
              {TIPOS.map((tp) => <option key={tp} value={tp}>{t(`finalizador.tipo.${tp}` as TranslationKey)}</option>)}
            </select>
          </Field>

          <Section title={t("finalizador.section.params")}>
            <Field label={t("finalizador.geraReceber")} hint={t("finalizador.geraReceberHint")}>
              <label className="field flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={geraReceber} onChange={(e) => setGeraReceber(e.target.checked)} />
                <span className="text-sm" style={{ color: v("--text") }}>{geraReceber ? t("common.yes") : t("common.no")}</span>
              </label>
            </Field>
            <Field label={t("finalizador.geraPagar")} hint={t("finalizador.geraPagarHint")}>
              <label className="field flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={geraPagar} onChange={(e) => setGeraPagar(e.target.checked)} />
                <span className="text-sm" style={{ color: v("--text") }}>{geraPagar ? t("common.yes") : t("common.no")}</span>
              </label>
            </Field>
            <Field label={t("finalizador.fundoTroco")} hint={t("finalizador.fundoTrocoHint")}>
              <label className="field flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={fundoTroco} onChange={(e) => setFundoTroco(e.target.checked)} />
                <span className="text-sm" style={{ color: v("--text") }}>{fundoTroco ? t("common.yes") : t("common.no")}</span>
              </label>
            </Field>
            <Field label={t("finalizador.permiteAvulso")} hint={t("finalizador.permiteAvulsoHint")}>
              <label className="field flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={permiteAvulso} onChange={(e) => setPermiteAvulso(e.target.checked)} />
                <span className="text-sm" style={{ color: v("--text") }}>{permiteAvulso ? t("common.yes") : t("common.no")}</span>
              </label>
            </Field>
          </Section>

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

  const paged = slicePage(ordenados, page);

  return (
    <div className="space-y-5">
      <CatalogHeader titulo={t("nav.finalizadores")} count={itens.length} novoLabel={t("finalizador.new")} onNovo={() => abrir()} />
      {erro && <p className="text-sm" style={{ color: "#ef4444" }}>{erro}</p>}
      <ListToolbar>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("finalizador.searchPlaceholder")}
          className="px-3 py-2 text-sm rounded-md outline-none w-64"
          style={{ background: v("--card"), border: `1px solid ${v("--border")}`, color: v("--text") }} />
        <StatusFilter value={filtroStatus} onChange={setFiltroStatus} />
      </ListToolbar>
      <div className="rounded-lg overflow-hidden" style={{ background: v("--card"), border: `1px solid ${v("--border")}` }}>
        <table className="drive-table w-full">
          <thead>
            <TableHeadRow
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={onSort}
              cols={[
                { label: "col.id", sort: "id" },
                { label: "common.name", sort: "nome" },
                { label: "finalizador.type", sort: "tipo" },
                { label: "finalizador.section.params" },
                { label: "common.status" },
                "",
              ]}
            />
          </thead>
          <tbody>
            {paged.slice.map((e) => (
              <tr key={e.id} className="drive-row-clickable" style={{ borderBottom: `1px solid ${v("--border")}` }} onClick={() => abrir(e)}>
                <Td mono gold>{e.id}</Td>
                <Td>{e.nome}</Td>
                <Td>{t(`finalizador.tipo.${e.tipo}` as TranslationKey)}</Td>
                <td className="drive-td">
                  <div className="flex flex-wrap gap-1">
                    {e.fundoTroco && <Chip label={t("finalizador.chip.troco")} />}
                    {e.permiteLancamentoAvulso && <Chip label={t("finalizador.chip.avulso")} />}
                    {e.geraContasReceber && <Chip label={t("finalizador.chip.receber")} />}
                    {e.geraContasPagar && <Chip label={t("finalizador.chip.pagar")} />}
                  </div>
                </td>
                <td className="drive-td drive-td-status" onClick={(ev) => ev.stopPropagation()}>
                  <StatusBadge
                    status={e.status === "inativo" ? "inativo" : "ativo"}
                    disabled={statusBusyId === e.id}
                    onToggle={() => void alternar(e)}
                  />
                </td>
                <td className="drive-td text-right">
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
