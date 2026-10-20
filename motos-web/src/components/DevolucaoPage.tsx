import { useCallback, useEffect, useMemo, useState } from "react";
import { Field, Section } from "@/components/crud/Field";
import { CatalogHeader, ListToolbar, TableHeadRow, TablePagination, Td, useListSort } from "@/components/crud/ListUi";
import { useCrudReset } from "@/hooks/useCrudReset";
import { useI18n, type TranslationKey } from "@/i18n";
import { mensagemErroApi } from "@/i18n/apiMessages";
import { tf } from "@/i18n/format";
import { useFilialId } from "@/auth/FilialContext";
import {
  criarDevolucao,
  listarCaixas,
  listarDevolucoes,
  listarFinalizadores,
  listarVendas,
  previewDevolucao,
  type Caixa,
  type Devolucao,
  type DevolucaoItemDisponivel,
  type DevolucaoPreview,
  type Finalizador,
  type Moeda,
  type Venda,
} from "@/api";
import { formatarDataHoraEpoch, formatMoeda, formatPyg, MOEDAS, slicePage } from "@/format";

const v = (name: string) => `var(${name})`;
const border1 = () => `1px solid ${v("--border")}`;

type Tratamento = "credito" | "ignorar" | "caixa";

function valorLinha(item: DevolucaoItemDisponivel, qtd: number): number {
  const vendida = item.quantidadeVendida;
  if (vendida <= 0 || qtd <= 0) return 0;
  const ja = Math.round(item.totalPyg * item.quantidadeDevolvida / vendida);
  if (item.quantidadeDevolvida + qtd >= vendida) return Math.max(0, item.totalPyg - ja);
  return Math.round(item.totalPyg * qtd / vendida);
}

function dePygVenda(pyg: number, moeda: Moeda, usd: number, brl: number): number {
  if (moeda === "pyg" || pyg <= 0) return Math.round(pyg);
  const taxa = moeda === "usd" ? usd : brl;
  if (taxa <= 0) return 0;
  return Math.round((pyg / taxa) * 100) / 100;
}

function rotuloTratamento(tratamento: string): TranslationKey {
  if (tratamento === "credito") return "devolucao.tratamento.credito";
  if (tratamento === "ignorar") return "devolucao.tratamento.ignorar";
  if (tratamento === "caixa") return "devolucao.tratamento.caixa";
  return "devolucao.tratamento.abater";
}

export default function DevolucaoPage({ navReset }: { navReset: number }) {
  const { t, locale } = useI18n();
  const idFilial = useFilialId();
  const [itens, setItens] = useState<Devolucao[]>([]);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [finalizadores, setFinalizadores] = useState<Finalizador[]>([]);
  const [caixas, setCaixas] = useState<Caixa[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [erro, setErro] = useState<string | null>(null);
  const [formAberto, setFormAberto] = useState(false);
  const [ficha, setFicha] = useState<Devolucao | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [buscaVenda, setBuscaVenda] = useState("");
  const [idVenda, setIdVenda] = useState<number | "">("");
  const [preview, setPreview] = useState<DevolucaoPreview | null>(null);
  const [qtd, setQtd] = useState<Record<number, string>>({});
  const [chassis, setChassis] = useState<Record<number, number[]>>({});
  const [tratamento, setTratamento] = useState<Tratamento>("credito");
  const [confirmaIgnorar, setConfirmaIgnorar] = useState(false);
  const [idFinalizador, setIdFinalizador] = useState<number | "">("");
  const [moedaCaixa, setMoedaCaixa] = useState<Moeda>("pyg");
  const [idSessao, setIdSessao] = useState<number | "">("");
  const [observacao, setObservacao] = useState("");

  const reset = useCallback(() => {
    setFormAberto(false);
    setFicha(null);
  }, []);
  useCrudReset(navReset, reset);

  const carregar = useCallback(async () => {
    try {
      setErro(null);
      const [lista, todas, fins, cxs] = await Promise.all([
        listarDevolucoes(idFilial),
        listarVendas(idFilial),
        listarFinalizadores(),
        listarCaixas(idFilial, true),
      ]);
      setItens(lista);
      setVendas(todas.filter((venda) => venda.status === "finalizada"));
      setFinalizadores(fins.filter((f) => f.status === "ativo" && !f.geraContasReceber && !f.geraContasPagar && !f.geraCreditoCliente));
      setCaixas(cxs.filter((c) => c.sessaoAbertaId));
    } catch (e) {
      setErro(mensagemErroApi(e, t, "common.error.saveFailed"));
    }
  }, [idFilial, t]);

  useEffect(() => { void carregar(); }, [carregar]);

  const filtrados = itens.filter((item) =>
    `${item.id} ${item.idVenda} ${item.clienteNome}`.toLowerCase().includes(search.toLowerCase()));
  const { items: ordenados, sortKey, sortDir, onSort } = useListSort(filtrados, (item, k) => {
    if (k === "cliente") return item.clienteNome;
    if (k === "venda") return item.idVenda;
    if (k === "valor") return item.valorPyg;
    if (k === "data") return item.criadoEm;
    return item.id;
  }, "id", "desc");
  useEffect(() => { setPage(1); }, [search, sortKey, sortDir]);

  const vendasFiltradas = useMemo(() => {
    const q = buscaVenda.trim().toLowerCase();
    return vendas.filter((venda) => !q || `${venda.id} ${venda.clienteNome}`.toLowerCase().includes(q)).slice(0, 80);
  }, [vendas, buscaVenda]);

  function abrirNova() {
    setFicha(null);
    setErro(null);
    setBuscaVenda("");
    setIdVenda("");
    setPreview(null);
    setQtd({});
    setChassis({});
    setTratamento("credito");
    setConfirmaIgnorar(false);
    setIdFinalizador("");
    setMoedaCaixa("pyg");
    setIdSessao(caixas[0]?.sessaoAbertaId ?? "");
    setObservacao("");
    setFormAberto(true);
  }

  async function escolherVenda(id: number) {
    setIdVenda(id);
    setErro(null);
    setPreview(null);
    try {
      const dados = await previewDevolucao(id);
      setPreview(dados);
      setQtd({});
      setChassis({});
    } catch (e) {
      setErro(mensagemErroApi(e, t, "common.error.saveFailed"));
    }
  }

  function quantidadeDe(item: DevolucaoItemDisponivel): number {
    if (item.controlaChassi) return (chassis[item.idVendaItem] ?? []).length;
    const n = Number.parseInt(qtd[item.idVendaItem] ?? "", 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }

  const resumo = useMemo(() => {
    if (!preview) return { valor: 0, abate: 0, excesso: 0 };
    const valor = preview.itens.reduce((soma, item) => soma + valorLinha(item, quantidadeDe(item)), 0);
    const abate = Math.min(valor, preview.abertoPyg);
    return { valor, abate, excesso: Math.max(0, valor - abate) };
  }, [preview, qtd, chassis]);

  async function salvar() {
    if (!preview || idVenda === "") return;
    setErro(null);
    if (resumo.valor <= 0) {
      setErro(t("api.DEVOLUCAO_ITENS"));
      return;
    }
    if (resumo.excesso > 1 && tratamento === "ignorar" && !confirmaIgnorar) {
      setErro(t("devolucao.ignorarConfirma"));
      return;
    }
    if (resumo.excesso > 1 && tratamento === "caixa") {
      if (idFinalizador === "" || caixas.length === 0) {
        setErro(t("devolucao.semCaixa"));
        return;
      }
    }
    setSalvando(true);
    try {
      await criarDevolucao({
        idFilial,
        idVenda,
        itens: preview.itens.map((item) => ({
          idVendaItem: item.idVendaItem,
          quantidade: item.controlaChassi ? 0 : quantidadeDe(item),
          idsUnidades: item.controlaChassi ? (chassis[item.idVendaItem] ?? []) : [],
        })).filter((item) => item.quantidade > 0 || item.idsUnidades.length > 0),
        tratamento: resumo.excesso > 1 ? tratamento : null,
        idFinalizador: resumo.excesso > 1 && tratamento === "caixa" ? idFinalizador : null,
        moedaCaixa: resumo.excesso > 1 && tratamento === "caixa" ? moedaCaixa : null,
        idCaixaSessao: resumo.excesso > 1 && tratamento === "caixa" && idSessao !== "" ? idSessao : null,
        observacao: observacao.trim() || null,
      });
      setFormAberto(false);
      await carregar();
    } catch (e) {
      setErro(mensagemErroApi(e, t, "common.error.saveFailed"));
    } finally {
      setSalvando(false);
    }
  }

  if (ficha) {
    return (
      <div className="space-y-5 max-w-5xl">
        <button type="button" className="text-xs cursor-pointer" style={{ color: v("--text-muted") }} onClick={() => setFicha(null)}>
          ← {t("common.back")}
        </button>
        <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)", color: v("--text") }}>
          {t("nav.devolucao")} #{ficha.id}
        </h1>
        <div className="rounded-lg p-6 space-y-3" style={{ background: v("--card"), border: border1() }}>
          <p className="text-sm" style={{ color: v("--text") }}>{ficha.clienteNome} · {t("devolucao.col.venda")} #{ficha.idVenda}</p>
          <p className="text-sm font-mono" style={{ color: v("--text") }}>Gs. {formatPyg(ficha.valorPyg)}</p>
          <p className="text-sm" style={{ color: v("--text-sub") }}>{t(rotuloTratamento(ficha.tratamento))}</p>
          <p className="text-xs" style={{ color: v("--text-muted") }}>
            {t("devolucao.abate")}: Gs. {formatPyg(ficha.abatidoPyg)} · {t("devolucao.excesso")}: Gs. {formatPyg(ficha.excessoPyg)}
          </p>
          <table className="drive-table w-full">
            <tbody>
              {ficha.itens.map((item) => (
                <tr key={item.id} style={{ borderBottom: border1() }}>
                  <Td>{item.produtoCodigo} · {item.produtoNome}</Td>
                  <Td mono>{item.quantidade}</Td>
                  <Td mono>Gs. {formatPyg(item.valorPyg)}</Td>
                  <td className="drive-td text-xs" style={{ color: v("--text-sub") }}>{item.chassis.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (formAberto) {
    const excessoMoeda = preview ? dePygVenda(resumo.excesso, moedaCaixa, preview.usdPyg, preview.brlPyg) : 0;
    return (
      <div className="space-y-5 max-w-5xl">
        <button type="button" className="text-xs cursor-pointer" style={{ color: v("--text-muted") }} onClick={() => setFormAberto(false)}>
          ← {t("common.back")}
        </button>
        <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)", color: v("--text") }}>{t("devolucao.new")}</h1>
        <form className="rounded-lg p-6 space-y-4" style={{ background: v("--card"), border: border1() }}
          onSubmit={(e) => { e.preventDefault(); void salvar(); }}>
          {erro && <p className="text-sm" style={{ color: "#ef4444" }}>{erro}</p>}
          <Field label={t("devolucao.searchPlaceholder")}>
            <input className="field" value={buscaVenda} onChange={(e) => setBuscaVenda(e.target.value)} />
          </Field>
          <Field label={t("devolucao.pickSale")} required>
            <select className="field" value={idVenda === "" ? "" : String(idVenda)}
              onChange={(e) => { if (e.target.value) void escolherVenda(Number(e.target.value)); }}>
              <option value="">{t("common.select")}</option>
              {vendasFiltradas.map((venda) => (
                <option key={venda.id} value={venda.id}>#{venda.id} · {venda.clienteNome} · Gs. {formatPyg(venda.totalPyg)}</option>
              ))}
            </select>
          </Field>

          {preview && (
            <>
              {preview.abertoPyg > 1 && (
                <div className="rounded-lg px-4 py-3" style={{ background: v("--card"), border: `1px solid ${v("--gold-border")}` }}>
                  <p className="text-sm" style={{ color: v("--gold") }}>{tf(t, "devolucao.aberto", { n: formatPyg(preview.abertoPyg) })}</p>
                </div>
              )}
              <table className="drive-table w-full">
                <thead>
                  <tr>
                    <th className="drive-th">{t("common.name")}</th>
                    <th className="drive-th">{t("devolucao.sold")}</th>
                    <th className="drive-th">{t("devolucao.returned")}</th>
                    <th className="drive-th">{t("devolucao.available")}</th>
                    <th className="drive-th">{t("devolucao.qty")}</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.itens.map((item) => (
                    <tr key={item.idVendaItem} style={{ borderBottom: border1() }}>
                      <td className="drive-td" style={{ color: v("--text") }}>
                        <div>{item.produtoCodigo} · {item.produtoNome}</div>
                        {item.controlaChassi && (
                          <div className="mt-2 space-y-1">
                            <p className="text-xs" style={{ color: v("--text-muted") }}>{t("devolucao.chassis")}</p>
                            {item.chassis.map((chassi) => {
                              const marcados = chassis[item.idVendaItem] ?? [];
                              const on = marcados.includes(chassi.id);
                              return (
                                <label key={chassi.id} className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: v("--text-sub") }}>
                                  <input type="checkbox" checked={on} onChange={() => {
                                    setChassis((atual) => {
                                      const lista = atual[item.idVendaItem] ?? [];
                                      return {
                                        ...atual,
                                        [item.idVendaItem]: on ? lista.filter((id) => id !== chassi.id) : [...lista, chassi.id],
                                      };
                                    });
                                  }} />
                                  {chassi.numero}
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </td>
                      <Td mono>{item.quantidadeVendida}</Td>
                      <Td mono>{item.quantidadeDevolvida}</Td>
                      <Td mono>{item.quantidadeDisponivel}</Td>
                      <td className="drive-td">
                        {item.controlaChassi ? (
                          <span className="font-mono text-sm" style={{ color: v("--text") }}>{quantidadeDe(item)}</span>
                        ) : (
                          <input className="field font-mono w-20" inputMode="numeric" disabled={item.quantidadeDisponivel <= 0}
                            value={qtd[item.idVendaItem] ?? ""}
                            onChange={(e) => setQtd((atual) => ({ ...atual, [item.idVendaItem]: e.target.value.replace(/\D/g, "") }))} />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <Section title={t("devolucao.tratamento")}>
                <p className="text-sm font-mono" style={{ color: v("--text") }}>
                  {t("devolucao.abate")}: Gs. {formatPyg(resumo.abate)} · {t("devolucao.excesso")}: Gs. {formatPyg(resumo.excesso)}
                </p>
                {resumo.excesso > 1 && (
                  <div className="space-y-2">
                    {(["credito", "ignorar", "caixa"] as Tratamento[]).map((op) => (
                      <label key={op} className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: v("--text") }}>
                        <input type="radio" name="tratamento" checked={tratamento === op} onChange={() => setTratamento(op)} />
                        {t(`devolucao.tratamento.${op}` as TranslationKey)}
                      </label>
                    ))}
                    {tratamento === "ignorar" && (
                      <label className="flex items-start gap-2 text-sm cursor-pointer" style={{ color: v("--text-sub") }}>
                        <input type="checkbox" checked={confirmaIgnorar} onChange={(e) => setConfirmaIgnorar(e.target.checked)} />
                        {t("devolucao.ignorarConfirma")}
                      </label>
                    )}
                    {tratamento === "caixa" && (
                      <div className="grid gap-3 md:grid-cols-3">
                        {caixas.length === 0 && <p className="text-sm md:col-span-3" style={{ color: "#ef4444" }}>{t("devolucao.semCaixa")}</p>}
                        <Field label={t("venda.pay")}>
                          <select className="field" value={idFinalizador === "" ? "" : String(idFinalizador)}
                            onChange={(e) => setIdFinalizador(e.target.value ? Number(e.target.value) : "")}>
                            <option value="">{t("common.select")}</option>
                            {finalizadores.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
                          </select>
                        </Field>
                        <Field label={t("titulo.moeda")}>
                          <select className="field" value={moedaCaixa} onChange={(e) => setMoedaCaixa(e.target.value as Moeda)}>
                            {MOEDAS.map((m) => (
                              <option key={m} value={m}>{m === "pyg" ? "PYG" : m === "usd" ? "USD" : "BRL"}</option>
                            ))}
                          </select>
                        </Field>
                        <Field label={t("nav.caixa")}>
                          <select className="field" value={idSessao === "" ? "" : String(idSessao)}
                            onChange={(e) => setIdSessao(e.target.value ? Number(e.target.value) : "")}>
                            {caixas.map((c) => (
                              <option key={c.id} value={c.sessaoAbertaId!}>{c.nome}</option>
                            ))}
                          </select>
                        </Field>
                        <p className="text-xs font-mono md:col-span-3" style={{ color: v("--text-muted") }}>
                          {formatMoeda(excessoMoeda, moedaCaixa)}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </Section>
              <Field label={t("caixa.note")}>
                <input className="field" value={observacao} onChange={(e) => setObservacao(e.target.value)} />
              </Field>
            </>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost px-4 py-2 text-sm" onClick={() => setFormAberto(false)}>{t("common.cancel")}</button>
            <button type="submit" disabled={salvando || !preview} className="btn-gold px-5 py-2 text-sm">{salvando ? t("common.saving") : t("common.save")}</button>
          </div>
        </form>
      </div>
    );
  }

  const paged = slicePage(ordenados, page);
  const dataLocale = locale === "es" ? "es-PY" : "pt-BR";
  return (
    <div className="space-y-5">
      <CatalogHeader titulo={t("nav.devolucao")} count={itens.length} novoLabel={t("devolucao.new")} onNovo={abrirNova} />
      {erro && <p className="text-sm" style={{ color: "#ef4444" }}>{erro}</p>}
      <ListToolbar>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("devolucao.searchPlaceholder")}
          className="px-3 py-2 text-sm rounded-md outline-none w-72"
          style={{ background: v("--card"), border: border1(), color: v("--text") }} />
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
                { label: "devolucao.col.cliente", sort: "cliente" },
                { label: "devolucao.col.venda", sort: "venda" },
                { label: "col.date", sort: "data" },
                { label: "devolucao.col.valor", sort: "valor" },
                { label: "devolucao.col.tratamento" },
              ]}
            />
          </thead>
          <tbody>
            {paged.slice.length === 0 && (
              <tr><td className="drive-td text-sm" colSpan={6} style={{ color: v("--text-muted") }}>{t("devolucao.empty")}</td></tr>
            )}
            {paged.slice.map((item) => (
              <tr key={item.id} className="drive-row-clickable" style={{ borderBottom: border1() }} onClick={() => setFicha(item)}>
                <Td mono gold>{item.id}</Td>
                <Td>{item.clienteNome}</Td>
                <Td mono>{item.idVenda}</Td>
                <Td mono>{formatarDataHoraEpoch(item.criadoEm, dataLocale)}</Td>
                <Td mono>Gs. {formatPyg(item.valorPyg)}</Td>
                <Td>{t(rotuloTratamento(item.tratamento))}</Td>
              </tr>
            ))}
          </tbody>
        </table>
        <TablePagination page={paged.pageSafe} total={paged.total} onPageChange={setPage} />
      </div>
    </div>
  );
}
