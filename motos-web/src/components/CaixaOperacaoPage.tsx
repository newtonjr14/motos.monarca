import { useCallback, useEffect, useMemo, useState } from "react";
import { Field, Section } from "@/components/crud/Field";
import { CatalogHeader, TableHeadRow, TablePagination, Td } from "@/components/crud/ListUi";
import { useCrudReset } from "@/hooks/useCrudReset";
import { useI18n } from "@/i18n";
import type { TranslationKey } from "@/i18n";
import { mensagemErroApi } from "@/i18n/apiMessages";
import { useFilial, useFilialId } from "@/auth/FilialContext";
import {
  abrirCaixaSessao,
  buscarCaixaSessao,
  fecharCaixaSessao,
  lancamentoAvulsoCaixa,
  listarCaixaMovimentacoes,
  listarCaixas,
  listarFinalizadores,
  transferirCaixa,
  type Caixa,
  type CaixaMovimentacao,
  type CaixaSessao,
  type Finalizador,
  type Moeda,
  type TipoMovimentacaoCaixa,
} from "@/api";
import { formatMoeda, slicePage } from "@/format";

const v = (name: string) => `var(${name})`;

type Modo = "abrir" | "fechar" | "transferir" | "lancamento" | "movimentos" | null;
type LinhaConferencia = { idFinalizador: number; moeda: Moeda };
type TipoAvulso = Extract<TipoMovimentacaoCaixa, "suprimento" | "sangria">;

const MOEDAS: Moeda[] = ["pyg", "usd", "brl"];
const chaveValor = (idFinalizador: number, moeda: Moeda) => `${idFinalizador}:${moeda}`;

function parseValor(raw: string | undefined): number {
  return Number((raw ?? "").replace(",", ".")) || 0;
}

function prefixoMoeda(moeda: Moeda): string {
  if (moeda === "usd") return "US$";
  if (moeda === "brl") return "R$";
  return "Gs.";
}

function labelMoedaKey(moeda: Moeda): TranslationKey {
  if (moeda === "usd") return "venda.currency.usd";
  if (moeda === "brl") return "venda.currency.brl";
  return "venda.currency.pyg";
}

function MoedaInput({
  moeda,
  value,
  onChange,
}: {
  moeda: Moeda;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div
      className="flex items-stretch w-full overflow-hidden rounded-lg"
      style={{ background: v("--card2"), border: `1px solid ${v("--border")}` }}
    >
      <span
        className="shrink-0 flex items-center px-2.5 text-xs font-mono select-none"
        style={{ color: v("--text-muted"), borderRight: `1px solid ${v("--border")}` }}
      >
        {prefixoMoeda(moeda)}
      </span>
      <input
        className="min-w-0 flex-1 font-mono text-sm outline-none px-2.5 py-[0.6rem]"
        style={{ background: "transparent", color: v("--text"), border: "none" }}
        inputMode="decimal"
        placeholder="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export default function CaixaOperacaoPage({ navReset }: { navReset: number }) {
  const { t } = useI18n();
  const idFilial = useFilialId();
  const { filial } = useFilial();
  const [caixas, setCaixas] = useState<Caixa[]>([]);
  const [finalizadores, setFinalizadores] = useState<Finalizador[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [erro, setErro] = useState<string | null>(null);
  const [modo, setModo] = useState<Modo>(null);
  const [alvo, setAlvo] = useState<Caixa | null>(null);
  const [sessao, setSessao] = useState<CaixaSessao | null>(null);
  const [linhas, setLinhas] = useState<LinhaConferencia[]>([]);
  const [valores, setValores] = useState<Record<string, string>>({});
  const [idDestino, setIdDestino] = useState<number | "">("");
  const [observacao, setObservacao] = useState("");
  const [movs, setMovs] = useState<CaixaMovimentacao[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [addFinId, setAddFinId] = useState<number | "">("");
  const [tipoAvulso, setTipoAvulso] = useState<TipoAvulso>("suprimento");
  const [idFinAvulso, setIdFinAvulso] = useState<number | "">("");
  const [moedaAvulsa, setMoedaAvulsa] = useState<Moeda>("pyg");
  const [valorAvulso, setValorAvulso] = useState("");

  const resetLista = useCallback(() => {
    setModo(null);
    setAlvo(null);
    setSessao(null);
  }, []);
  useCrudReset(navReset, resetLista);

  async function carregar() {
    try {
      setErro(null);
      const [lista, fins] = await Promise.all([
        listarCaixas(idFilial, true),
        listarFinalizadores(),
      ]);
      setCaixas(lista);
      setFinalizadores(fins.filter((f) => f.status === "ativo"));
    } catch (e) {
      setErro(mensagemErroApi(e, t, "common.error.loadFailed"));
    }
  }
  useEffect(() => { void carregar(); }, [idFilial]);
  useEffect(() => { setPage(1); }, [search]);

  const nomeFinalizador = useCallback(
    (id: number) => finalizadores.find((f) => f.id === id)?.nome ?? String(id),
    [finalizadores],
  );

  const esperadoMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of sessao?.saldos ?? []) {
      map.set(chaveValor(s.idFinalizador, s.moeda ?? "pyg"), s.valor);
    }
    return map;
  }, [sessao]);

  function valoresBody() {
    return linhas
      .map((l) => ({
        idFinalizador: l.idFinalizador,
        moeda: l.moeda,
        valor: parseValor(valores[chaveValor(l.idFinalizador, l.moeda)]),
      }))
      .filter((l) => l.valor > 0);
  }

  function setValorLinha(idFinalizador: number, moeda: Moeda, valor: string) {
    setValores((atual) => ({ ...atual, [chaveValor(idFinalizador, moeda)]: valor }));
  }

  function temLinha(idFinalizador: number, moeda: Moeda) {
    return linhas.some((l) => l.idFinalizador === idFinalizador && l.moeda === moeda);
  }

  function adicionarLinha(idFinalizador: number, moeda: Moeda) {
    if (temLinha(idFinalizador, moeda)) return;
    setLinhas((atual) => [...atual, { idFinalizador, moeda }]);
  }

  async function iniciar(caixa: Caixa, next: Modo) {
    setAlvo(caixa);
    setErro(null);
    setObservacao("");
    setValores({});
    setIdDestino("");
    setMovs([]);
    setAddFinId("");
    setLinhas([]);
    setTipoAvulso("suprimento");
    setIdFinAvulso("");
    setMoedaAvulsa((filial?.moedaOperacao ?? "pyg") as Moeda);
    setValorAvulso("");
    try {
      if (next === "abrir") {
        const fundos = finalizadores.filter((f) => f.fundoTroco);
        if (!fundos.length) {
          setErro(t("caixa.error.noFundoTroco"));
          return;
        }
        setLinhas(fundos.flatMap((f) => MOEDAS.map((moeda) => ({ idFinalizador: f.id, moeda }))));
        setSessao(null);
        setModo(next);
        return;
      }
      if (caixa.sessaoAbertaId) {
        const atual = await buscarCaixaSessao(caixa.sessaoAbertaId);
        setSessao(atual);
        if (next === "lancamento") {
          const avulsos = finalizadores.filter((f) => f.permiteLancamentoAvulso);
          if (!avulsos.length) {
            setErro(t("caixa.error.noAvulso"));
            return;
          }
          setIdFinAvulso(avulsos[0]?.id ?? "");
          setModo(next);
          return;
        }
        if (next === "fechar" || next === "transferir") {
          const comSaldo = atual.saldos.filter((s) => Math.abs(s.valor) > 1e-9);
          const nextLinhas = comSaldo.map((s) => ({
            idFinalizador: s.idFinalizador,
            moeda: (s.moeda ?? "pyg") as Moeda,
          }));
          setLinhas(nextLinhas);
          const preset: Record<string, string> = {};
          for (const s of comSaldo) {
            preset[chaveValor(s.idFinalizador, s.moeda ?? "pyg")] = String(s.valor);
          }
          setValores(preset);
        }
        if (next === "movimentos") {
          setMovs(await listarCaixaMovimentacoes(caixa.sessaoAbertaId));
        }
      }
      setModo(next);
    } catch (e) {
      setErro(mensagemErroApi(e, t, "common.error.loadFailed"));
    }
  }

  async function salvarAbrir() {
    if (!alvo) return;
    setSalvando(true);
    try {
      await abrirCaixaSessao({ idCaixa: alvo.id, conferencia: valoresBody(), observacao: observacao.trim() || null });
      setModo(null);
      await carregar();
    } catch (e) {
      setErro(mensagemErroApi(e, t, "common.error.saveFailed"));
    } finally {
      setSalvando(false);
    }
  }

  async function salvarFechar() {
    if (!sessao) return;
    const conferencia = valoresBody();
    if (!conferencia.length) {
      setErro(t("caixa.error.conferencia"));
      return;
    }
    setSalvando(true);
    try {
      await fecharCaixaSessao(sessao.id, { conferencia, observacao: observacao.trim() || null });
      setModo(null);
      await carregar();
    } catch (e) {
      setErro(mensagemErroApi(e, t, "common.error.saveFailed"));
    } finally {
      setSalvando(false);
    }
  }

  async function salvarTransferir() {
    if (!sessao || idDestino === "") {
      setErro(t("caixa.error.destino"));
      return;
    }
    const conferencia = valoresBody();
    if (!conferencia.length) {
      setErro(t("caixa.error.valor"));
      return;
    }
    setSalvando(true);
    try {
      await transferirCaixa(sessao.id, { idCaixaDestino: idDestino, conferencia, observacao: observacao.trim() || null });
      setModo(null);
      await carregar();
    } catch (e) {
      setErro(mensagemErroApi(e, t, "common.error.saveFailed"));
    } finally {
      setSalvando(false);
    }
  }

  async function salvarLancamento() {
    if (!sessao || idFinAvulso === "" || !valorAvulso.trim()) {
      setErro(t("caixa.error.lancamento"));
      return;
    }
    const valor = parseValor(valorAvulso);
    if (valor <= 0) {
      setErro(t("caixa.error.lancamento"));
      return;
    }
    setSalvando(true);
    try {
      await lancamentoAvulsoCaixa(sessao.id, {
        tipo: tipoAvulso,
        idFinalizador: idFinAvulso,
        moeda: moedaAvulsa,
        valor,
        observacao: observacao.trim() || null,
      });
      setModo(null);
      await carregar();
    } catch (e) {
      setErro(mensagemErroApi(e, t, "common.error.saveFailed"));
    } finally {
      setSalvando(false);
    }
  }

  const finalizadoresAvulso = useMemo(
    () => finalizadores.filter((f) => f.permiteLancamentoAvulso),
    [finalizadores],
  );

  const gruposAbrir = useMemo(() => {
    const ids = [...new Set(linhas.map((l) => l.idFinalizador))];
    return ids.map((id) => ({
      id,
      nome: nomeFinalizador(id),
      moedas: MOEDAS.filter((m) => linhas.some((l) => l.idFinalizador === id && l.moeda === m)),
    }));
  }, [linhas, nomeFinalizador]);

  const resumoMoedas = useMemo(() => {
    if (modo !== "fechar" && modo !== "transferir") return [];
    const moedas = new Set<Moeda>();
    for (const l of linhas) moedas.add(l.moeda);
    for (const s of sessao?.saldos ?? []) {
      if (Math.abs(s.valor) > 1e-9) moedas.add(s.moeda ?? "pyg");
    }
    return MOEDAS.filter((m) => moedas.has(m)).map((moeda) => {
      const informado = linhas
        .filter((l) => l.moeda === moeda)
        .reduce((acc, l) => acc + parseValor(valores[chaveValor(l.idFinalizador, l.moeda)]), 0);
      const esperado = [...esperadoMap.entries()]
        .filter(([k]) => k.endsWith(`:${moeda}`))
        .reduce((acc, [, val]) => acc + val, 0);
      const diff = informado - esperado;
      return { moeda, informado, esperado, diff };
    });
  }, [modo, linhas, valores, sessao, esperadoMap]);

  function corDiff(diff: number): string {
    if (Math.abs(diff) < 1e-6) return "#16a34a";
    return "#ef4444";
  }

  function rotuloDiff(diff: number): string {
    if (Math.abs(diff) < 1e-6) return t("caixa.ok");
    if (diff < 0) return t("caixa.shortage");
    return t("caixa.surplus");
  }

  if (modo && alvo) {
    const titulo = modo === "abrir" ? t("caixa.open")
      : modo === "fechar" ? t("caixa.close")
        : modo === "transferir" ? t("caixa.transfer")
          : modo === "lancamento" ? t("caixa.lancamento")
            : t("caixa.movements");
    const comResumo = modo === "fechar" || modo === "transferir";

    return (
      <div className={`space-y-5 ${comResumo ? "max-w-5xl" : "max-w-2xl"}`}>
        <button type="button" className="text-xs cursor-pointer" style={{ color: v("--text-muted") }} onClick={() => setModo(null)}>
          ← {t("common.back")}
        </button>
        <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)", color: v("--text") }}>
          {titulo} · {alvo.nome}
        </h1>

        {modo === "movimentos" ? (
          <div className="rounded-lg overflow-hidden" style={{ background: v("--card"), border: `1px solid ${v("--border")}` }}>
            {erro && <p className="text-sm p-4" style={{ color: "#ef4444" }}>{erro}</p>}
            <table className="drive-table w-full">
              <thead>
                <TableHeadRow cols={["caixa.movementType", "caixa.user", "caixa.amount", ""]} />
              </thead>
              <tbody>
                {movs.map((m) => (
                  <tr key={m.id} style={{ borderBottom: `1px solid ${v("--border")}` }}>
                    <Td>{t(`caixa.mov.${m.tipo}` as TranslationKey)}</Td>
                    <Td>{m.usuarioNome}</Td>
                    <Td mono>{m.finalizadores.map((f) => `${f.finalizadorNome ?? ""} ${formatMoeda(f.valor, f.moeda ?? "pyg")}`).join(" · ")}</Td>
                    <Td sub>{m.observacao ?? ""}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!movs.length && <div className="py-12 text-center text-sm" style={{ color: v("--text-muted") }}>{t("common.noRecords")}</div>}
          </div>
        ) : (
          <form
            className={comResumo ? "grid gap-5 lg:grid-cols-[1fr_280px] lg:items-start" : undefined}
            onSubmit={(e) => {
              e.preventDefault();
              if (modo === "abrir") void salvarAbrir();
              if (modo === "fechar") void salvarFechar();
              if (modo === "transferir") void salvarTransferir();
              if (modo === "lancamento") void salvarLancamento();
            }}
          >
            <div className="rounded-lg p-6 space-y-4" style={{ background: v("--card"), border: `1px solid ${v("--border")}` }}>
              {erro && <p className="text-sm" style={{ color: "#ef4444" }}>{erro}</p>}

              {modo === "lancamento" ? (
                <>
                  <Field label={t("caixa.lancamento.tipo")} required>
                    <select className="field" value={tipoAvulso} onChange={(e) => setTipoAvulso(e.target.value as TipoAvulso)}>
                      <option value="suprimento">{t("caixa.lancamento.suprimento")}</option>
                      <option value="sangria">{t("caixa.lancamento.sangria")}</option>
                    </select>
                  </Field>
                  <Field label={t("nav.finalizadores")} required>
                    <select className="field" value={idFinAvulso} onChange={(e) => setIdFinAvulso(e.target.value ? Number(e.target.value) : "")}>
                      <option value="">{t("common.select")}</option>
                      {finalizadoresAvulso.map((f) => (
                        <option key={f.id} value={f.id}>{f.nome}</option>
                      ))}
                    </select>
                  </Field>
                  <div className="form-grid-2">
                    <Field label={t("produto.currency")} required>
                      <select className="field" value={moedaAvulsa} onChange={(e) => setMoedaAvulsa(e.target.value as Moeda)}>
                        {MOEDAS.map((m) => (
                          <option key={m} value={m}>{t(labelMoedaKey(m))}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label={t("caixa.lancamento.valor")} required>
                      <MoedaInput moeda={moedaAvulsa} value={valorAvulso} onChange={setValorAvulso} />
                    </Field>
                  </div>
                </>
              ) : (
                <>
              {modo === "transferir" && (
                <Field label={t("caixa.destination")} required>
                  <select className="field" value={idDestino} onChange={(e) => setIdDestino(e.target.value ? Number(e.target.value) : "")}>
                    <option value="">{t("common.select")}</option>
                    {caixas.filter((c) => c.id !== alvo.id && c.sessaoAbertaId).map((c) => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                </Field>
              )}

              {modo === "abrir" ? (
                <Section title={t("caixa.fundoTroco")}>
                  <div className="space-y-4">
                    {gruposAbrir.map((g) => (
                      <div key={g.id} className="space-y-2">
                        <p className="text-sm font-medium" style={{ color: v("--text") }}>{g.nome}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {g.moedas.map((moeda) => (
                            <MoedaInput
                              key={moeda}
                              moeda={moeda}
                              value={valores[chaveValor(g.id, moeda)] ?? ""}
                              onChange={(val) => setValorLinha(g.id, moeda, val)}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              ) : (
                <Section title={t("caixa.conferencia")}>
                  <div className="rounded-md overflow-hidden" style={{ border: `1px solid ${v("--border")}` }}>
                    <table className="drive-table w-full">
                      <thead>
                        <tr>
                          <th className="drive-th text-left">{t("common.name")}</th>
                          <th className="drive-th text-left w-28">{t("produto.currency")}</th>
                          <th className="drive-th text-right">{t("caixa.informed")}</th>
                          {modo === "fechar" && (
                            <th className="drive-th text-right">{t("caixa.expected")}</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {linhas.map((l) => {
                          const chave = chaveValor(l.idFinalizador, l.moeda);
                          const esperado = esperadoMap.get(chave) ?? 0;
                          return (
                            <tr key={chave} style={{ borderBottom: `1px solid ${v("--border")}` }}>
                              <Td>{nomeFinalizador(l.idFinalizador)}</Td>
                              <Td sub>{t(labelMoedaKey(l.moeda))}</Td>
                              <td className="drive-td">
                                <MoedaInput
                                  moeda={l.moeda}
                                  value={valores[chave] ?? ""}
                                  onChange={(val) => setValorLinha(l.idFinalizador, l.moeda, val)}
                                />
                              </td>
                              {modo === "fechar" && (
                                <Td mono right>{formatMoeda(esperado, l.moeda)}</Td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {!linhas.length && (
                      <div className="py-8 text-center text-sm" style={{ color: v("--text-muted") }}>{t("common.noRecords")}</div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <select
                      className="field text-sm w-auto min-w-[12rem]"
                      value={addFinId}
                      onChange={(e) => setAddFinId(e.target.value ? Number(e.target.value) : "")}
                    >
                      <option value="">{t("caixa.addFinalizer")}</option>
                      {finalizadores
                        .filter((f) => MOEDAS.some((m) => !temLinha(f.id, m)))
                        .map((f) => (
                          <option key={f.id} value={f.id}>{f.nome}</option>
                        ))}
                    </select>
                    <button
                      type="button"
                      className="btn-ghost text-sm px-3 py-1.5"
                      disabled={addFinId === ""}
                      onClick={() => {
                        if (addFinId === "") return;
                        const moedaPadrao = (filial?.moedaOperacao ?? "pyg") as Moeda;
                        if (!temLinha(addFinId, moedaPadrao)) adicionarLinha(addFinId, moedaPadrao);
                        else {
                          const prox = MOEDAS.find((m) => !temLinha(addFinId, m));
                          if (prox) adicionarLinha(addFinId, prox);
                        }
                        setAddFinId("");
                      }}
                    >
                      {t("caixa.include")}
                    </button>
                    {linhas.length > 0 && (
                      <button
                        type="button"
                        className="text-xs cursor-pointer"
                        style={{ color: v("--gold") }}
                        onClick={() => {
                          const id = addFinId !== ""
                            ? addFinId
                            : [...new Set(linhas.map((l) => l.idFinalizador))].find((fid) =>
                              MOEDAS.some((m) => !temLinha(fid, m)),
                            );
                          if (id == null) return;
                          const prox = MOEDAS.find((m) => !temLinha(id, m));
                          if (prox) adicionarLinha(id, prox);
                          setAddFinId("");
                        }}
                      >
                        {t("caixa.addCurrency")}
                      </button>
                    )}
                  </div>
                </Section>
              )}
                </>
              )}

              <Field label={t("caixa.note")}>
                <input className="field" value={observacao} onChange={(e) => setObservacao(e.target.value)} />
              </Field>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn-ghost px-4 py-2 text-sm" onClick={() => setModo(null)}>{t("common.cancel")}</button>
                <button type="submit" disabled={salvando} className="btn-gold px-5 py-2 text-sm">{salvando ? t("common.saving") : t("common.save")}</button>
              </div>
            </div>

            {comResumo && (
              <aside
                className="rounded-lg p-5 space-y-4 lg:sticky lg:top-4"
                style={{ background: v("--card"), border: `1px solid ${v("--border")}` }}
              >
                <p className="text-sm font-medium uppercase tracking-wide" style={{ color: v("--gold") }}>
                  {t("caixa.summary")}
                </p>
                {resumoMoedas.length === 0 ? (
                  <p className="text-sm" style={{ color: v("--text-muted") }}>—</p>
                ) : (
                  resumoMoedas.map((r) => (
                    <div key={r.moeda} className="space-y-1 pb-3" style={{ borderBottom: `1px solid ${v("--border")}` }}>
                      <p className="text-xs font-medium" style={{ color: v("--text-sub") }}>{t(labelMoedaKey(r.moeda))}</p>
                      <div className="flex justify-between text-sm font-mono">
                        <span style={{ color: v("--text-muted") }}>{t("caixa.informed")}</span>
                        <span style={{ color: v("--text") }}>{formatMoeda(r.informado, r.moeda)}</span>
                      </div>
                      {modo === "fechar" && (
                        <div className="flex justify-between text-sm font-mono">
                          <span style={{ color: v("--text-muted") }}>{t("caixa.expected")}</span>
                          <span style={{ color: v("--text") }}>{formatMoeda(r.esperado, r.moeda)}</span>
                        </div>
                      )}
                      {modo === "fechar" && (
                        <div className="flex justify-between text-sm font-mono pt-1">
                          <span style={{ color: corDiff(r.diff) }}>{rotuloDiff(r.diff)}</span>
                          <span style={{ color: corDiff(r.diff) }}>{formatMoeda(r.diff, r.moeda)}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </aside>
            )}
          </form>
        )}
      </div>
    );
  }

  const filtered = caixas.filter((e) => e.nome.toLowerCase().includes(search.toLowerCase()));
  const paged = slicePage(filtered, page);

  return (
    <div className="space-y-5">
      <CatalogHeader titulo={t("nav.caixa")} count={caixas.length} novoLabel={t("caixa.open")} onNovo={() => {
        const padrao = caixas.find((c) => c.padrao && !c.sessaoAbertaId) ?? caixas.find((c) => !c.sessaoAbertaId);
        if (padrao) void iniciar(padrao, "abrir");
        else setErro(t("caixa.error.noneClosed"));
      }} />
      {erro && <p className="text-sm" style={{ color: "#ef4444" }}>{erro}</p>}
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("caixa.searchPlaceholder")}
        className="px-3 py-2 text-sm rounded-md outline-none w-64"
        style={{ background: v("--card"), border: `1px solid ${v("--border")}`, color: v("--text") }} />
      <div className="rounded-lg overflow-hidden" style={{ background: v("--card"), border: `1px solid ${v("--border")}` }}>
        <table className="drive-table w-full">
          <thead>
            <TableHeadRow cols={["common.name", "caixa.session", ""]} />
          </thead>
          <tbody>
            {paged.slice.map((e) => (
              <tr key={e.id} style={{ borderBottom: `1px solid ${v("--border")}` }}>
                <Td>{e.nome}{e.padrao ? ` · ${t("caixa.default")}` : ""}</Td>
                <Td>{e.sessaoAbertaId ? t("caixa.session.open") : t("caixa.session.closed")}</Td>
                <td className="drive-td text-right space-x-3">
                  {!e.sessaoAbertaId && (
                    <button className="text-xs cursor-pointer" style={{ color: v("--gold") }} onClick={() => void iniciar(e, "abrir")}>{t("caixa.open")}</button>
                  )}
                  {!!e.sessaoAbertaId && (
                    <>
                      <button className="text-xs cursor-pointer" style={{ color: v("--gold") }} onClick={() => void iniciar(e, "fechar")}>{t("caixa.close")}</button>
                      <button className="text-xs cursor-pointer" style={{ color: v("--gold") }} onClick={() => void iniciar(e, "lancamento")}>{t("caixa.lancamento")}</button>
                      <button className="text-xs cursor-pointer" style={{ color: v("--gold") }} onClick={() => void iniciar(e, "transferir")}>{t("caixa.transfer")}</button>
                      <button className="text-xs cursor-pointer" style={{ color: v("--gold") }} onClick={() => void iniciar(e, "movimentos")}>{t("caixa.movements")}</button>
                    </>
                  )}
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
