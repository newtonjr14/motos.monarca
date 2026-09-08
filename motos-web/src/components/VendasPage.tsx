import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Field, Section } from "@/components/crud/Field";
import { CatalogHeader, TableHeadRow, TablePagination, Td } from "@/components/crud/ListUi";
import { useCrudReset } from "@/hooks/useCrudReset";
import { useI18n } from "@/i18n";
import { mensagemErroApi } from "@/i18n/apiMessages";
import { useFilialId } from "@/auth/FilialContext";
import {
  buscarCotacaoHoje,
  criarVenda,
  listarCaixas,
  listarFinalizadores,
  listarPapeis,
  listarProdutos,
  listarVendas,
  type Caixa,
  type Cotacao,
  type Finalizador,
  type Papel,
  type Produto,
  type Venda,
} from "@/api";
import {
  formatarDocumentoExibicao,
  formatarTelefoneExibicao,
  formatPyg,
  slicePage,
} from "@/format";

const v = (name: string) => `var(${name})`;
const border1 = () => `1px solid ${v("--border")}`;

type ItemDraft = { idProduto: number; quantidade: number };
type PagDraft = { idFinalizador: number; valor: string };

function paraPyg(preco: number, moeda: string, cotacao: Cotacao | null): number {
  if (!cotacao) return 0;
  if (moeda === "usd") return Math.round(preco * cotacao.usdPyg);
  if (moeda === "brl") return Math.round(preco * cotacao.brlPyg);
  return Math.round(preco);
}

function parseGs(valor: string): number {
  return Number(valor.replace(",", ".")) || 0;
}

function textoCliente(c: Papel): string {
  const docs = c.pessoa.documentos.map((d) => `${d.tipoNome} ${d.numero}`).join(" ");
  return `${c.pessoa.nomeRazaoSocial} ${c.pessoa.email ?? ""} ${c.pessoa.telefone ?? ""} ${docs}`;
}

function docCliente(c: Papel): string | null {
  const doc = c.pessoa.documentos[0];
  if (!doc) return null;
  return `${doc.tipoNome} ${formatarDocumentoExibicao(doc.tipoCodigo, doc.numero)}`;
}

function textoProduto(p: Produto): string {
  return `${p.codigo} ${p.nome} ${p.marca} ${p.modelo}`;
}

export default function VendasPage({ navReset }: { navReset: number }) {
  const { t } = useI18n();
  const idFilial = useFilialId();
  const [itens, setItens] = useState<Venda[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [clientes, setClientes] = useState<Papel[]>([]);
  const [finalizadores, setFinalizadores] = useState<Finalizador[]>([]);
  const [caixas, setCaixas] = useState<Caixa[]>([]);
  const [cotacao, setCotacao] = useState<Cotacao | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [erro, setErro] = useState<string | null>(null);
  const [formAberto, setFormAberto] = useState(false);
  const [vendo, setVendo] = useState<Venda | null>(null);

  const resetLista = useCallback(() => {
    setFormAberto(false);
    setVendo(null);
  }, []);
  useCrudReset(navReset, resetLista);

  async function carregar() {
    try {
      setErro(null);
      const [vendas, prods, clis, fins, cxs] = await Promise.all([
        listarVendas(idFilial),
        listarProdutos(idFilial),
        listarPapeis("clientes", idFilial),
        listarFinalizadores(),
        listarCaixas(idFilial, true),
      ]);
      setItens(vendas);
      setProdutos(prods.filter((p) => p.status === "ativo" && p.precoLista > 0));
      setClientes(clis.filter((c) => c.status === "ativo"));
      setFinalizadores(fins.filter((f) => f.status === "ativo"));
      setCaixas(cxs);
      try { setCotacao(await buscarCotacaoHoje()); } catch { setCotacao(null); }
    } catch (e) {
      setErro(mensagemErroApi(e, t, "common.error.loadFailed"));
    }
  }
  useEffect(() => { void carregar(); }, [idFilial]);
  useEffect(() => { setPage(1); }, [search]);

  if (formAberto && vendo) {
    return (
      <div className="space-y-5 max-w-5xl">
        <button type="button" className="text-xs cursor-pointer" style={{ color: v("--text-muted") }} onClick={() => { setFormAberto(false); setVendo(null); }}>
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
            {vendo.negociacao.map((n) => `${n.finalizadorNome} Gs. ${formatPyg(n.valor)}`).join(" · ")}
          </p>
        </div>
      </div>
    );
  }

  if (formAberto) {
    return (
      <VendaForm
        idFilial={idFilial}
        produtos={produtos}
        clientes={clientes}
        finalizadores={finalizadores}
        caixas={caixas}
        cotacao={cotacao}
        onClose={() => setFormAberto(false)}
        onSaved={async () => { setFormAberto(false); await carregar(); }}
      />
    );
  }

  const filtered = itens.filter((e) => `${e.id} ${e.clienteNome} ${e.vendedorNome}`.toLowerCase().includes(search.toLowerCase()));
  const paged = slicePage(filtered, page);

  return (
    <div className="space-y-5">
      <CatalogHeader titulo={t("nav.vendas")} count={itens.length} novoLabel={t("venda.new")} onNovo={() => { setVendo(null); setFormAberto(true); }} />
      {erro && <p className="text-sm" style={{ color: "#ef4444" }}>{erro}</p>}
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("common.search")}
        className="px-3 py-2 text-sm rounded-md outline-none w-64"
        style={{ background: v("--card"), border: border1(), color: v("--text") }} />
      <div className="rounded-lg overflow-hidden" style={{ background: v("--card"), border: border1() }}>
        <table className="drive-table w-full">
          <thead>
            <TableHeadRow cols={["col.id", "venda.client", "venda.total", "venda.seller"]} />
          </thead>
          <tbody>
            {paged.slice.map((e) => (
              <tr key={e.id} className="drive-row-clickable" style={{ borderBottom: border1() }}
                onClick={() => { setVendo(e); setFormAberto(true); }}>
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

function VendaForm({
  idFilial, produtos, clientes, finalizadores, caixas, cotacao, onClose, onSaved,
}: {
  idFilial: number;
  produtos: Produto[];
  clientes: Papel[];
  finalizadores: Finalizador[];
  caixas: Caixa[];
  cotacao: Cotacao | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const { t } = useI18n();
  const caixasAbertos = caixas.filter((c) => c.sessaoAbertaId);
  const [idCliente, setIdCliente] = useState<number | "">("");
  const [idSessao, setIdSessao] = useState<number | "">(() =>
    caixas.find((c) => c.padrao && c.sessaoAbertaId)?.sessaoAbertaId
    ?? caixas.find((c) => c.sessaoAbertaId)?.sessaoAbertaId
    ?? "",
  );
  const [linhas, setLinhas] = useState<ItemDraft[]>([]);
  const [pagamentos, setPagamentos] = useState<PagDraft[]>([]);
  const [observacao, setObservacao] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const [buscaCliente, setBuscaCliente] = useState("");
  const [listaCliente, setListaCliente] = useState(false);
  const [buscaProduto, setBuscaProduto] = useState("");
  const [listaProduto, setListaProduto] = useState(false);
  const produtoRef = useRef<HTMLInputElement>(null);

  const cliente = idCliente === "" ? undefined : clientes.find((c) => c.id === idCliente);

  const totalPyg = useMemo(() => linhas.reduce((acc, linha) => {
    const p = produtos.find((x) => x.id === linha.idProduto);
    if (!p) return acc;
    return acc + paraPyg(p.precoLista, p.moedaPreco, cotacao) * linha.quantidade;
  }, 0), [linhas, produtos, cotacao]);

  const pago = pagamentos.reduce((acc, p) => acc + parseGs(p.valor), 0);
  const falta = Math.round(totalPyg - pago);

  useEffect(() => {
    setPagamentos((atual) => {
      if (atual.length !== 1) return atual;
      const unico = atual[0]!;
      const alvo = totalPyg > 0 ? String(Math.round(totalPyg)) : "";
      return unico.valor === alvo ? atual : [{ ...unico, valor: alvo }];
    });
  }, [totalPyg]);

  const clientesFiltrados = useMemo(() => {
    const q = buscaCliente.trim().toLowerCase();
    const base = q ? clientes.filter((c) => textoCliente(c).toLowerCase().includes(q)) : clientes;
    return base.slice(0, 8);
  }, [clientes, buscaCliente]);

  const produtosFiltrados = useMemo(() => {
    const q = buscaProduto.trim().toLowerCase();
    if (!q) return produtos.slice(0, 8);
    const exato = produtos.filter((p) => p.codigo.toLowerCase() === q);
    if (exato.length) return exato;
    return produtos.filter((p) => textoProduto(p).toLowerCase().includes(q)).slice(0, 8);
  }, [produtos, buscaProduto]);

  function lancarProduto(id: number) {
    const p = produtos.find((x) => x.id === id);
    if (!p) {
      setErro(t("venda.error.product"));
      return;
    }
    const atual = linhas.find((l) => l.idProduto === id);
    const next = (atual?.quantidade ?? 0) + 1;
    if (p.quantidadeDisponivel != null && next > p.quantidadeDisponivel) {
      setErro(t("venda.error.qty"));
      return;
    }
    setLinhas((lista) => {
      const i = lista.findIndex((l) => l.idProduto === id);
      if (i >= 0) {
        const copy = [...lista];
        copy[i] = { ...copy[i]!, quantidade: next };
        return copy;
      }
      return [...lista, { idProduto: id, quantidade: 1 }];
    });
    setBuscaProduto("");
    setListaProduto(false);
    setErro(null);
    produtoRef.current?.focus();
  }

  function alterarQtd(idProduto: number, delta: number) {
    const atual = linhas.find((l) => l.idProduto === idProduto);
    if (!atual) return;
    const next = atual.quantidade + delta;
    if (next <= 0) {
      setLinhas((lista) => lista.filter((l) => l.idProduto !== idProduto));
      setErro(null);
      return;
    }
    const p = produtos.find((x) => x.id === idProduto);
    if (p?.quantidadeDisponivel != null && next > p.quantidadeDisponivel) {
      setErro(t("venda.error.qty"));
      return;
    }
    setLinhas((lista) => lista.map((l) => l.idProduto === idProduto ? { ...l, quantidade: next } : l));
    setErro(null);
  }

  function escolherFinalizador(id: number) {
    const ja = pagamentos.find((p) => p.idFinalizador === id);
    if (ja) {
      if (pagamentos.length > 1) {
        setPagamentos((atual) => atual.filter((p) => p.idFinalizador !== id));
      }
      return;
    }
    const pagoAtual = pagamentos.reduce((acc, p) => acc + parseGs(p.valor), 0);
    const rest = Math.max(0, Math.round(totalPyg - pagoAtual));
    setPagamentos((atual) => [...atual, { idFinalizador: id, valor: rest > 0 ? String(rest) : "" }]);
    setErro(null);
  }

  async function salvar() {
    setErro(null);
    if (idCliente === "") {
      setErro(t("venda.error.client"));
      return;
    }
    if (!linhas.length) {
      setErro(t("venda.error.items"));
      return;
    }
    const negociacao = pagamentos
      .map((p) => ({ idFinalizador: p.idFinalizador, valor: parseGs(p.valor) }))
      .filter((p) => p.valor > 0);
    if (!negociacao.length) {
      setErro(t("venda.error.pay"));
      return;
    }
    if (Math.abs(negociacao.reduce((a, p) => a + p.valor, 0) - totalPyg) > 1) {
      setErro(t("api.VENDA_NEGOCIACAO_DIVERGENTE"));
      return;
    }
    setSalvando(true);
    try {
      await criarVenda({
        idFilial,
        idCliente,
        idCaixaSessao: idSessao === "" ? null : idSessao,
        itens: linhas.map((l) => ({ idProduto: l.idProduto, quantidade: l.quantidade })),
        negociacao,
        observacao: observacao.trim() || null,
      });
      await onSaved();
    } catch (e) {
      setErro(mensagemErroApi(e, t, "common.error.saveFailed"));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-5 max-w-5xl">
      <button type="button" className="text-xs cursor-pointer" style={{ color: v("--text-muted") }} onClick={onClose}>
        ← {t("common.back")}
      </button>
      <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)", color: v("--text") }}>{t("venda.new")}</h1>

      <form className="pdv-grid" onSubmit={(e) => { e.preventDefault(); void salvar(); }}>
          <div className="rounded-lg p-5 space-y-5" style={{ background: v("--card"), border: border1() }}>
            {erro && <p className="text-sm" style={{ color: "#ef4444" }}>{erro}</p>}

            <Section title={t("venda.client")}>
              {cliente ? (
                <div className="rounded-md px-3 py-2.5 flex items-start justify-between gap-3" style={{ background: v("--card2"), border: border1() }}>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: v("--text") }}>{cliente.pessoa.nomeRazaoSocial}</p>
                    <p className="text-xs mt-0.5 font-mono" style={{ color: v("--text-muted") }}>
                      {[docCliente(cliente), formatarTelefoneExibicao(cliente.pessoa.ddi, cliente.pessoa.telefone)]
                        .filter((x) => x && x !== "—")
                        .join(" · ")}
                    </p>
                  </div>
                  <button type="button" className="text-xs cursor-pointer shrink-0" style={{ color: v("--gold") }}
                    onClick={() => { setIdCliente(""); setBuscaCliente(""); setListaCliente(true); }}>
                    {t("venda.changeClient")}
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Field label={t("venda.clientSearch")} required>
                    <input
                      className="field"
                      autoFocus
                      value={buscaCliente}
                      placeholder={t("venda.clientSearchPlaceholder")}
                      onChange={(e) => { setBuscaCliente(e.target.value); setListaCliente(true); }}
                      onFocus={() => setListaCliente(true)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const first = clientesFiltrados[0];
                          if (first) {
                            setIdCliente(first.id);
                            setListaCliente(false);
                            setBuscaCliente("");
                            produtoRef.current?.focus();
                          }
                        } else if (e.key === "Escape") {
                          setListaCliente(false);
                        }
                      }}
                    />
                  </Field>
                  {listaCliente && (
                    <>
                      <div className="fixed inset-0 z-20" onClick={() => setListaCliente(false)} />
                      <ul className="absolute left-0 right-0 mt-1 z-30 rounded-md shadow-lg overflow-hidden max-h-56 overflow-y-auto"
                        style={{ background: v("--card"), border: border1() }}>
                        {clientesFiltrados.map((c) => (
                          <li key={c.id}>
                            <button type="button" className="w-full text-left px-3 py-2 cursor-pointer hover:opacity-90"
                              style={{ color: v("--text-sub") }}
                              onClick={() => { setIdCliente(c.id); setListaCliente(false); setBuscaCliente(""); produtoRef.current?.focus(); }}>
                              <span className="block text-sm" style={{ color: v("--text") }}>{c.pessoa.nomeRazaoSocial}</span>
                              {docCliente(c) && <span className="block text-xs font-mono" style={{ color: v("--text-muted") }}>{docCliente(c)}</span>}
                            </button>
                          </li>
                        ))}
                        {clientesFiltrados.length === 0 && (
                          <li className="px-3 py-2 text-sm" style={{ color: v("--text-muted") }}>{t("common.noRecords")}</li>
                        )}
                      </ul>
                    </>
                  )}
                </div>
              )}
            </Section>

            <Section title={t("venda.items")}>
              <div className="relative">
                <Field label={t("venda.productSearch")}>
                  <input
                    ref={produtoRef}
                    className="field"
                    value={buscaProduto}
                    placeholder={t("venda.productSearchPlaceholder")}
                    onChange={(e) => { setBuscaProduto(e.target.value); setListaProduto(true); }}
                    onFocus={() => setListaProduto(true)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const first = produtosFiltrados[0];
                        if (first) lancarProduto(first.id);
                      } else if (e.key === "Escape") {
                        setListaProduto(false);
                      }
                    }}
                  />
                </Field>
                {listaProduto && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setListaProduto(false)} />
                    <ul className="absolute left-0 right-0 mt-1 z-30 rounded-md shadow-lg overflow-hidden max-h-56 overflow-y-auto"
                      style={{ background: v("--card"), border: border1() }}>
                      {produtosFiltrados.map((p) => (
                        <li key={p.id}>
                          <button type="button" className="w-full text-left px-3 py-2 cursor-pointer hover:opacity-90"
                            onClick={() => lancarProduto(p.id)}>
                            <span className="flex items-center justify-between gap-2">
                              <span className="min-w-0">
                                <span className="block text-sm" style={{ color: v("--text") }}>{p.nome}</span>
                                <span className="block text-xs font-mono" style={{ color: v("--text-muted") }}>
                                  {p.codigo} · {t("venda.stock")} {p.quantidadeDisponivel ?? 0}
                                </span>
                              </span>
                              <span className="text-xs font-mono shrink-0" style={{ color: v("--gold") }}>
                                Gs. {formatPyg(paraPyg(p.precoLista, p.moedaPreco, cotacao))}
                              </span>
                            </span>
                          </button>
                        </li>
                      ))}
                      {produtosFiltrados.length === 0 && (
                        <li className="px-3 py-2 text-sm" style={{ color: v("--text-muted") }}>{t("common.noRecords")}</li>
                      )}
                    </ul>
                  </>
                )}
              </div>

              {linhas.length === 0 ? (
                <p className="text-sm py-3" style={{ color: v("--text-muted") }}>{t("venda.emptyCart")}</p>
              ) : (
                <div className="space-y-2 mt-1">
                  {linhas.map((l) => {
                    const p = produtos.find((x) => x.id === l.idProduto);
                    const unit = p ? paraPyg(p.precoLista, p.moedaPreco, cotacao) : 0;
                    return (
                      <div key={l.idProduto} className="rounded-md px-3 py-2.5 flex items-center gap-3"
                        style={{ background: v("--card2"), border: border1() }}>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm truncate" style={{ color: v("--text") }}>{p?.nome}</p>
                          <p className="text-xs font-mono mt-0.5" style={{ color: v("--text-muted") }}>
                            {p?.codigo} · {t("venda.unit")} Gs. {formatPyg(unit)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button type="button" className="btn-ghost w-7 h-7 text-sm" onClick={() => alterarQtd(l.idProduto, -1)}>−</button>
                          <span className="font-mono text-sm w-7 text-center" style={{ color: v("--text") }}>{l.quantidade}</span>
                          <button type="button" className="btn-ghost w-7 h-7 text-sm" onClick={() => alterarQtd(l.idProduto, 1)}>+</button>
                        </div>
                        <p className="font-mono text-sm w-24 text-right shrink-0" style={{ color: v("--gold") }}>
                          Gs. {formatPyg(unit * l.quantidade)}
                        </p>
                        <button type="button" className="text-xs cursor-pointer shrink-0" style={{ color: "var(--danger)" }}
                          title={t("common.delete")}
                          onClick={() => setLinhas((atual) => atual.filter((x) => x.idProduto !== l.idProduto))}>✕</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </Section>

            <Section title={t("venda.pay")}>
              <div className="flex flex-wrap gap-2">
                {finalizadores.map((f) => {
                  const ativo = pagamentos.some((p) => p.idFinalizador === f.id);
                  return (
                    <button
                      key={f.id}
                      type="button"
                      className="px-3 py-2 text-sm rounded-md cursor-pointer"
                      style={{
                        background: ativo ? "var(--gold-bg)" : v("--card2"),
                        border: ativo ? `1px solid ${v("--gold-border")}` : border1(),
                        color: ativo ? v("--gold") : v("--text-sub"),
                      }}
                      onClick={() => escolherFinalizador(f.id)}
                    >
                      {f.nome}
                    </button>
                  );
                })}
              </div>
              {pagamentos.map((p) => {
                const fin = finalizadores.find((f) => f.id === p.idFinalizador);
                return (
                  <Field key={p.idFinalizador} label={`${t("venda.amount")} · ${fin?.nome ?? ""}`} className="mt-2">
                    <input
                      className="field font-mono"
                      inputMode="decimal"
                      value={p.valor}
                      onChange={(e) => setPagamentos((atual) =>
                        atual.map((x) => x.idFinalizador === p.idFinalizador ? { ...x, valor: e.target.value } : x))}
                    />
                  </Field>
                );
              })}
            </Section>

            <Field label={t("caixa.note")}>
              <input className="field" value={observacao} onChange={(e) => setObservacao(e.target.value)} />
            </Field>
          </div>

          <aside className="rounded-lg p-5 space-y-4 h-fit lg:sticky lg:top-4" style={{ background: v("--card"), border: border1() }}>
            <Field label={t("venda.till")} required hint={caixasAbertos.length ? t("venda.tillHint") : t("venda.noTill")}>
              <select className="field" value={idSessao} onChange={(e) => setIdSessao(e.target.value ? Number(e.target.value) : "")}>
                <option value="">{t("common.select")}</option>
                {caixasAbertos.map((c) => (
                  <option key={c.id} value={c.sessaoAbertaId ?? ""}>{c.nome}</option>
                ))}
              </select>
            </Field>
            <div className="space-y-2 text-sm" style={{ borderTop: border1(), paddingTop: "0.75rem" }}>
              <div className="flex justify-between gap-3">
                <span style={{ color: v("--text-muted") }}>{t("venda.subtotal")}</span>
                <span className="font-mono" style={{ color: v("--text") }}>Gs. {formatPyg(totalPyg)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span style={{ color: v("--text-muted") }}>{t("venda.paid")}</span>
                <span className="font-mono" style={{ color: v("--text") }}>Gs. {formatPyg(pago)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span style={{ color: v("--text-muted") }}>{t("venda.remaining")}</span>
                <span className="font-mono" style={{ color: falta === 0 ? "var(--success)" : v("--gold") }}>
                  Gs. {formatPyg(Math.max(0, falta))}
                </span>
              </div>
              <div className="flex justify-between gap-3 pt-2" style={{ borderTop: border1() }}>
                <span className="font-medium" style={{ color: v("--text") }}>{t("venda.total")}</span>
                <span className="font-mono font-semibold" style={{ color: v("--gold") }}>Gs. {formatPyg(totalPyg)}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2 pt-1">
              <button type="submit" disabled={salvando} className="btn-gold px-5 py-2.5 text-sm w-full">
                {salvando ? t("common.saving") : t("venda.finish")}
              </button>
              <button type="button" className="btn-ghost px-4 py-2 text-sm w-full" onClick={onClose}>{t("common.cancel")}</button>
            </div>
          </aside>
      </form>
    </div>
  );
}
