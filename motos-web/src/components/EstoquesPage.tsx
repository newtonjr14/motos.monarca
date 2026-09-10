import { useCallback, useEffect, useMemo, useState } from "react";
import { Field } from "@/components/crud/Field";
import { CatalogHeader, ListToolbar, StatusBadge, StatusFilter, TableHeadRow, TablePagination, Td, passaFiltroStatus, useListSort, type FiltroStatus } from "@/components/crud/ListUi";
import { useCrudReset } from "@/hooks/useCrudReset";
import { useI18n } from "@/i18n";
import { mensagemErroApi } from "@/i18n/apiMessages";
import { tf } from "@/i18n/format";
import { useFilialId } from "@/auth/FilialContext";
import {
  atualizarEstoque,
  atualizarEstoqueProduto,
  criarEstoque,
  criarEstoqueProduto,
  excluirEstoque,
  listarEstoqueProdutos,
  listarEstoques,
  listarFiliais,
  listarProdutos,
  type Estoque,
  type EstoqueProduto,
  type Produto,
} from "@/api";
import { slicePage, toTitleCase } from "@/format";

const v = (name: string) => `var(${name})`;
const border1 = () => `1px solid ${v("--border")}`;

export default function EstoquesPage({ navReset }: { navReset: number }) {
  const { t } = useI18n();
  const idFilial = useFilialId();
  const [itens, setItens] = useState<Estoque[]>([]);
  const [search, setSearch] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("todos");
  const [page, setPage] = useState(1);
  const [erro, setErro] = useState<string | null>(null);
  const [formAberto, setFormAberto] = useState(false);
  const [editando, setEditando] = useState<Estoque | null>(null);
  const [nome, setNome] = useState("");
  const [status, setStatus] = useState<"ativo" | "inativo">("ativo");
  const [idEstoquePadrao, setIdEstoquePadrao] = useState<number | null>(null);
  const [salvando, setSalvando] = useState(false);

  const [aberto, setAberto] = useState<Estoque | null>(null);
  const [saldos, setSaldos] = useState<EstoqueProduto[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [buscaSaldo, setBuscaSaldo] = useState("");
  const [pageSaldo, setPageSaldo] = useState(1);
  const [itemForm, setItemForm] = useState(false);
  const [editandoItem, setEditandoItem] = useState<EstoqueProduto | null>(null);
  const [idProduto, setIdProduto] = useState<number | "">("");
  const [quantidade, setQuantidade] = useState("0");
  const [reservada, setReservada] = useState("0");

  const resetLista = useCallback(() => {
    setFormAberto(false);
    setEditando(null);
    setAberto(null);
    setItemForm(false);
    setEditandoItem(null);
  }, []);
  useCrudReset(navReset, resetLista);

  async function carregar() {
    try {
      setErro(null);
      const [estoques, filiais] = await Promise.all([listarEstoques(idFilial), listarFiliais()]);
      setItens(estoques);
      setIdEstoquePadrao(filiais.find((f) => f.id === idFilial)?.idEstoquePadrao ?? null);
    } catch (e) {
      setErro(mensagemErroApi(e, t, "common.error.loadFailed"));
    }
  }
  useEffect(() => { void carregar(); }, [idFilial]);
  const filtered = itens.filter((e) =>
    passaFiltroStatus(e.status, filtroStatus) && e.nome.toLowerCase().includes(search.toLowerCase()));
  const { items: ordenados, sortKey, sortDir, onSort } = useListSort(filtered, (e, k) => k === "nome" ? e.nome : e.id);
  const filteredSaldos = saldos.filter((s) =>
    `${s.produtoCodigo} ${s.produtoNome}`.toLowerCase().includes(buscaSaldo.toLowerCase()));
  const { items: saldosOrdenados, sortKey: sortKeySaldo, sortDir: sortDirSaldo, onSort: onSortSaldo } = useListSort(
    filteredSaldos,
    (s, k) => {
      if (k === "codigo") return s.produtoCodigo;
      if (k === "nome") return s.produtoNome;
      if (k === "tipo") return s.produtoTipo;
      if (k === "quantidade") return s.quantidade;
      if (k === "quantidadeDisponivel") return s.quantidadeDisponivel;
      return s.id;
    },
  );
  useEffect(() => { setPage(1); }, [search, filtroStatus, sortKey, sortDir]);
  useEffect(() => { setPageSaldo(1); }, [buscaSaldo, sortKeySaldo, sortDirSaldo]);

  async function carregarSaldos(estoque: Estoque) {
    const [lista, prods] = await Promise.all([
      listarEstoqueProdutos(estoque.id),
      listarProdutos(idFilial),
    ]);
    setSaldos(lista);
    setProdutos(prods.filter((p) => p.status === "ativo"));
  }

  async function abrirItens(estoque: Estoque) {
    setErro(null);
    setBuscaSaldo("");
    setPageSaldo(1);
    setItemForm(false);
    setEditandoItem(null);
    try {
      await carregarSaldos(estoque);
      setAberto(estoque);
    } catch (e) {
      setErro(mensagemErroApi(e, t, "common.error.loadFailed"));
    }
  }

  function abrir(item?: Estoque) {
    setEditando(item ?? null);
    setNome(item?.nome ?? "");
    setStatus(item?.status === "inativo" ? "inativo" : "ativo");
    setErro(null);
    setFormAberto(true);
  }

  async function salvar() {
    setErro(null);
    if (!nome.trim()) {
      setErro(t("estoque.error.nameRequired"));
      return;
    }
    setSalvando(true);
    try {
      const body = { idFilial, nome: toTitleCase(nome), status };
      if (editando) await atualizarEstoque(editando.id, body);
      else await criarEstoque(body);
      setFormAberto(false);
      await carregar();
    } catch (e) {
      setErro(mensagemErroApi(e, t, "common.error.saveFailed"));
    } finally {
      setSalvando(false);
    }
  }

  function abrirItem(item?: EstoqueProduto) {
    setEditandoItem(item ?? null);
    setIdProduto(item?.idProduto ?? "");
    setQuantidade(item ? String(item.quantidade) : "0");
    setReservada(item ? String(item.quantidadeReservada) : "0");
    setErro(null);
    setItemForm(true);
  }

  const produtosDisponiveis = useMemo(() => {
    const ids = new Set(saldos.map((s) => s.idProduto));
    return produtos.filter((p) => !ids.has(p.id));
  }, [produtos, saldos]);

  async function salvarItem() {
    if (!aberto) return;
    setErro(null);
    const qtd = Number(quantidade);
    const res = Number(reservada);
    if (!Number.isInteger(qtd) || !Number.isInteger(res) || qtd < 0 || res < 0 || res > qtd) {
      setErro(t("estoque.error.qtyInvalid"));
      return;
    }
    const produtoId = editandoItem?.idProduto ?? (idProduto === "" ? null : idProduto);
    if (produtoId == null) {
      setErro(t("estoque.error.productRequired"));
      return;
    }
    setSalvando(true);
    try {
      const body = {
        idEstoque: aberto.id,
        idProduto: produtoId,
        quantidade: qtd,
        quantidadeReservada: res,
        status: "ativo" as const,
      };
      if (editandoItem) await atualizarEstoqueProduto(editandoItem.id, body);
      else await criarEstoqueProduto(body);
      setItemForm(false);
      setEditandoItem(null);
      await carregarSaldos(aberto);
    } catch (e) {
      setErro(mensagemErroApi(e, t, "common.error.saveFailed"));
    } finally {
      setSalvando(false);
    }
  }

  if (itemForm && aberto) {
    const qtdN = Number(quantidade);
    const resN = Number(reservada);
    const disponivel = Number.isInteger(qtdN) && Number.isInteger(resN) ? qtdN - resN : null;
    return (
      <div className="space-y-5 max-w-xl">
        <button type="button" className="text-xs cursor-pointer" style={{ color: v("--text-muted") }}
          onClick={() => { setItemForm(false); setEditandoItem(null); setErro(null); }}>
          ← {t("estoque.backItems")}
        </button>
        <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)", color: v("--text") }}>
          {editandoItem ? t("estoque.itemEdit") : t("estoque.itemNew")}
        </h1>
        <form className="rounded-lg p-6 space-y-4" style={{ background: v("--card"), border: border1() }}
          onSubmit={(e) => { e.preventDefault(); void salvarItem(); }}>
          {erro && <p className="text-sm" style={{ color: "#ef4444" }}>{erro}</p>}
          <Field label={t("estoque.product")} required>
            {editandoItem ? (
              <input className="field" readOnly value={`${editandoItem.produtoCodigo} · ${editandoItem.produtoNome}`} />
            ) : (
              <select className="field" autoFocus value={idProduto}
                onChange={(e) => setIdProduto(e.target.value ? Number(e.target.value) : "")}>
                <option value="">{t("common.select")}</option>
                {produtosDisponiveis.map((p) => (
                  <option key={p.id} value={p.id}>{p.codigo} · {p.nome}</option>
                ))}
              </select>
            )}
          </Field>
          <Field label={t("estoque.qty")} required>
            <input className="field font-mono" inputMode="numeric" autoFocus={Boolean(editandoItem)}
              value={quantidade} onChange={(e) => setQuantidade(e.target.value)} />
          </Field>
          <Field label={t("estoque.reserved")} hint={t("estoque.reservedHint")}>
            <input className="field font-mono" inputMode="numeric" value={reservada}
              onChange={(e) => setReservada(e.target.value)} />
          </Field>
          {disponivel != null && (
            <p className="text-sm font-mono" style={{ color: v("--gold") }}>
              {t("estoque.available")}: {disponivel}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost px-4 py-2 text-sm"
              onClick={() => { setItemForm(false); setEditandoItem(null); }}>{t("common.cancel")}</button>
            <button type="submit" disabled={salvando} className="btn-gold px-5 py-2 text-sm">
              {salvando ? t("common.saving") : t("common.save")}
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (formAberto) {
    return (
      <div className="space-y-5 max-w-xl">
        <button type="button" className="text-xs cursor-pointer" style={{ color: v("--text-muted") }} onClick={() => setFormAberto(false)}>
          ← {t("common.back")}
        </button>
        <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)", color: v("--text") }}>
          {editando ? t("estoque.edit") : t("estoque.new")}
        </h1>
        <form className="rounded-lg p-6 space-y-4" style={{ background: v("--card"), border: border1() }}
          onSubmit={(e) => { e.preventDefault(); void salvar(); }}>
          {erro && <p className="text-sm" style={{ color: "#ef4444" }}>{erro}</p>}
          <Field label={t("common.name")} required>
            <input className="field" autoFocus value={nome} onChange={(e) => setNome(e.target.value)}
              onBlur={() => setNome((x) => toTitleCase(x))} placeholder={t("estoque.placeholderName")} />
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

  if (aberto) {
    const pagedSaldos = slicePage(saldosOrdenados, pageSaldo);
    return (
      <div className="space-y-5">
        <button type="button" className="text-xs cursor-pointer" style={{ color: v("--text-muted") }}
          onClick={() => { setAberto(null); setErro(null); }}>
          ← {t("estoque.backList")}
        </button>
        <CatalogHeader
          titulo={aberto.nome}
          count={saldos.length}
          novoLabel={t("estoque.itemNew")}
          onNovo={() => abrirItem()}
        />
        {erro && <p className="text-sm" style={{ color: "#ef4444" }}>{erro}</p>}
        <input value={buscaSaldo} onChange={(e) => setBuscaSaldo(e.target.value)} placeholder={t("common.search")}
          className="px-3 py-2 text-sm rounded-md outline-none w-64"
          style={{ background: v("--card"), border: border1(), color: v("--text") }} />
        <div className="rounded-lg overflow-hidden" style={{ background: v("--card"), border: border1() }}>
          <table className="drive-table w-full">
            <thead>
              <TableHeadRow
                sortKey={sortKeySaldo}
                sortDir={sortDirSaldo}
                onSort={onSortSaldo}
                cols={[
                  { label: "col.code", sort: "codigo" },
                  { label: "common.name", sort: "nome" },
                  { label: "produto.tipo", sort: "tipo" },
                  { label: "estoque.qty", sort: "quantidade" },
                  { label: "estoque.reserved" },
                  { label: "estoque.available", sort: "quantidadeDisponivel" },
                  "",
                ]}
              />
            </thead>
            <tbody>
              {pagedSaldos.slice.map((s) => (
                <tr key={s.id} className="drive-row-clickable" style={{ borderBottom: border1() }}
                  onClick={() => abrirItem(s)}>
                  <Td mono gold>{s.produtoCodigo}</Td>
                  <td className="drive-td text-xs font-medium" style={{ color: v("--text") }}>{s.produtoNome}</td>
                  <Td sub>{s.produtoTipo === "moto" ? t("produto.tipo.moto") : t("produto.tipo.bicicleta")}</Td>
                  <Td mono>{s.quantidade}</Td>
                  <Td mono sub>{s.quantidadeReservada}</Td>
                  <Td mono>{s.quantidadeDisponivel}</Td>
                  <td className="drive-td text-right">
                    <button type="button" className="text-xs cursor-pointer" style={{ color: v("--gold") }}
                      onClick={(e) => { e.stopPropagation(); abrirItem(s); }}>{t("common.edit")}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filteredSaldos.length && <div className="py-12 text-center text-sm" style={{ color: v("--text-muted") }}>{t("common.noRecords")}</div>}
          {filteredSaldos.length > 0 && <TablePagination page={pagedSaldos.pageSafe} total={pagedSaldos.total} onPageChange={setPageSaldo} />}
        </div>
      </div>
    );
  }

  const paged = slicePage(ordenados, page);

  return (
    <div className="space-y-5">
      <CatalogHeader titulo={t("nav.estoques")} count={itens.length} novoLabel={t("estoque.new")} onNovo={() => abrir()} />
      {erro && <p className="text-sm" style={{ color: "#ef4444" }}>{erro}</p>}
      <ListToolbar>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("common.search")}
          className="px-3 py-2 text-sm rounded-md outline-none w-64"
          style={{ background: v("--card"), border: border1(), color: v("--text") }} />
        <StatusFilter value={filtroStatus} onChange={setFiltroStatus} />
      </ListToolbar>
      <div className="rounded-lg overflow-hidden" style={{ background: v("--card"), border: border1() }}>
        <table className="drive-table w-full">
          <thead>
            <TableHeadRow
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={onSort}
              cols={[
                { label: "col.id", sort: "id" },
                { label: "common.name", sort: "nome" },
                { label: "common.status" },
                "",
              ]}
            />
          </thead>
          <tbody>
            {paged.slice.map((e) => (
              <tr key={e.id} className="drive-row-clickable" style={{ borderBottom: border1() }}
                onClick={() => void abrirItens(e)}>
                <Td mono gold>{e.id}</Td>
                <td className="drive-td text-xs font-medium" style={{ color: v("--text") }}>
                  {e.nome}
                  {idEstoquePadrao === e.id && (
                    <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide" style={{ color: v("--gold") }}>
                      {t("estoque.padraoBadge")}
                    </span>
                  )}
                </td>
                <td className="drive-td"><StatusBadge status={e.status === "inativo" ? "inativo" : "ativo"} /></td>
                <td className="drive-td text-right">
                  <button type="button" className="text-xs cursor-pointer mr-3" style={{ color: v("--gold") }}
                    onClick={(ev) => { ev.stopPropagation(); void abrirItens(e); }}>{t("estoque.items")}</button>
                  <button type="button" className="text-xs cursor-pointer mr-3" style={{ color: v("--gold") }}
                    onClick={(ev) => { ev.stopPropagation(); abrir(e); }}>{t("common.edit")}</button>
                  <button type="button" className="text-xs cursor-pointer" style={{ color: "var(--danger)" }}
                    onClick={async (ev) => {
                      ev.stopPropagation();
                      if (!confirm(tf(t, "common.confirmDelete", { name: e.nome }))) return;
                      try { await excluirEstoque(e.id); await carregar(); }
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
