import { useCallback, useEffect, useState } from "react";
import { Field } from "@/components/crud/Field";
import { CatalogHeader, ListToolbar, StatusBadge, StatusFilter, TableHeadRow, TablePagination, Td, passaFiltroStatus, useAlternarStatus, useListSort, type FiltroStatus } from "@/components/crud/ListUi";
import { useCrudReset } from "@/hooks/useCrudReset";
import { useI18n } from "@/i18n";
import { mensagemErroApi } from "@/i18n/apiMessages";
import { tf } from "@/i18n/format";
import {
  atualizarModelo,
  criarModelo,
  excluirModelo,
  listarMarcas,
  listarModelos,
  type Marca,
  type Modelo,
  type TipoProduto,
} from "@/api";
import { slicePage, toTitleCase } from "@/format";

const v = (name: string) => `var(${name})`;

export default function ModelosPage({ navReset }: { navReset: number }) {
  const { t } = useI18n();
  const [itens, setItens] = useState<Modelo[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [search, setSearch] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("todos");
  const [page, setPage] = useState(1);
  const [erro, setErro] = useState<string | null>(null);
  const [formAberto, setFormAberto] = useState(false);
  const [editando, setEditando] = useState<Modelo | null>(null);
  const [idMarca, setIdMarca] = useState<number | "">("");
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<TipoProduto>("moto");
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
      const [modelos, catalogo] = await Promise.all([listarModelos(), listarMarcas()]);
      setItens(modelos);
      setMarcas(catalogo);
    } catch (e) {
      setErro(mensagemErroApi(e, t, "common.error.loadFailed"));
    }
  }
  useEffect(() => { void carregar(); }, []);
  const { statusBusyId, alternar } = useAlternarStatus(
    setItens,
    (item, proximo) => atualizarModelo(item.id, {
      idMarca: item.idMarca,
      nome: item.nome,
      tipo: item.tipo,
      status: proximo,
    }),
    (e) => setErro(mensagemErroApi(e, t, "common.error.saveFailed")),
    carregar,
  );
  const filtered = itens.filter((e) =>
    passaFiltroStatus(e.status, filtroStatus) &&
    `${e.nome} ${e.marcaNome} ${e.tipo}`.toLowerCase().includes(search.toLowerCase()));
  const { items: ordenados, sortKey, sortDir, onSort } = useListSort(filtered, (e, k) => {
    if (k === "marca") return e.marcaNome;
    if (k === "nome") return e.nome;
    if (k === "tipo") return e.tipo;
    return e.id;
  });
  useEffect(() => { setPage(1); }, [search, filtroStatus, sortKey, sortDir]);

  function abrir(item?: Modelo) {
    setEditando(item ?? null);
    setIdMarca(item?.idMarca ?? "");
    setNome(item?.nome ?? "");
    setTipo(item?.tipo ?? "moto");
    setStatus(item?.status === "inativo" ? "inativo" : "ativo");
    setErro(null);
    setFormAberto(true);
  }

  async function salvar() {
    setErro(null);
    if (idMarca === "" || !nome.trim()) {
      setErro(t("modelo.error.required"));
      return;
    }
    setSalvando(true);
    try {
      const body = { idMarca: Number(idMarca), nome: toTitleCase(nome), tipo, status };
      if (editando) await atualizarModelo(editando.id, body);
      else await criarModelo(body);
      setFormAberto(false);
      await carregar();
    } catch (e) {
      setErro(mensagemErroApi(e, t, "common.error.saveFailed"));
    } finally {
      setSalvando(false);
    }
  }

  if (formAberto) {
    const marcasAtivas = marcas.filter((m) => m.status === "ativo" || m.id === editando?.idMarca);
    return (
      <div className="space-y-5 max-w-xl">
        <button type="button" className="text-xs cursor-pointer" style={{ color: v("--text-muted") }} onClick={() => setFormAberto(false)}>
          ← {t("common.back")}
        </button>
        <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)", color: v("--text") }}>
          {editando ? t("modelo.edit") : t("modelo.new")}
        </h1>
        <form className="rounded-lg p-6 space-y-4" style={{ background: v("--card"), border: `1px solid ${v("--border")}` }}
          onSubmit={(e) => { e.preventDefault(); void salvar(); }}>
          {erro && <p className="text-sm" style={{ color: "#ef4444" }}>{erro}</p>}
          <Field label={t("produto.marca")} required>
            <select className="field" value={idMarca} onChange={(e) => setIdMarca(e.target.value ? Number(e.target.value) : "")}>
              <option value="">{t("common.select")}</option>
              {marcasAtivas.map((m) => (
                <option key={m.id} value={m.id}>{m.nome}</option>
              ))}
            </select>
          </Field>
          <Field label={t("common.name")} required>
            <input className="field" autoFocus value={nome} onChange={(e) => setNome(e.target.value)}
              onBlur={() => setNome((x) => toTitleCase(x))} />
          </Field>
          <Field label={t("produto.tipo")} required>
            <select className="field" value={tipo} disabled={Boolean(editando)}
              onChange={(e) => setTipo(e.target.value as TipoProduto)}>
              <option value="moto">{t("produto.tipo.moto")}</option>
              <option value="bicicleta">{t("produto.tipo.bicicleta")}</option>
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

  const paged = slicePage(ordenados, page);

  return (
    <div className="space-y-5">
      <CatalogHeader titulo={t("nav.modelos")} count={itens.length} novoLabel={t("modelo.new")} onNovo={() => abrir()} />
      {erro && <p className="text-sm" style={{ color: "#ef4444" }}>{erro}</p>}
      <ListToolbar>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("modelo.searchPlaceholder")}
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
                { label: "produto.marca", sort: "marca" },
                { label: "common.name", sort: "nome" },
                { label: "produto.tipo", sort: "tipo" },
                { label: "common.status" },
                "",
              ]}
            />
          </thead>
          <tbody>
            {paged.slice.map((e) => (
              <tr key={e.id} style={{ borderBottom: `1px solid ${v("--border")}` }}>
                <Td mono gold>{e.id}</Td>
                <Td sub>{e.marcaNome}</Td>
                <td className="drive-td text-xs font-medium" style={{ color: v("--text") }}>{e.nome}</td>
                <Td sub>{e.tipo === "moto" ? t("produto.tipo.moto") : t("produto.tipo.bicicleta")}</Td>
                <td className="drive-td drive-td-status" onClick={(ev) => ev.stopPropagation()}>
                  <StatusBadge
                    status={e.status === "inativo" ? "inativo" : "ativo"}
                    disabled={statusBusyId === e.id}
                    onToggle={() => void alternar(e)}
                  />
                </td>
                <td className="drive-td text-right">
                  <button className="text-xs cursor-pointer mr-3" style={{ color: v("--gold") }} onClick={() => abrir(e)}>{t("common.edit")}</button>
                  <button className="text-xs cursor-pointer" style={{ color: "var(--danger)" }}
                    onClick={async () => {
                      if (!confirm(tf(t, "common.confirmDelete", { name: e.nome }))) return;
                      try { await excluirModelo(e.id); await carregar(); }
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
