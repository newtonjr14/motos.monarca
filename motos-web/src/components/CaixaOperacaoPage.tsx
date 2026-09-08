import { useCallback, useEffect, useState } from "react";
import { Field, Section } from "@/components/crud/Field";
import { CatalogHeader, TableHeadRow, TablePagination, Td } from "@/components/crud/ListUi";
import { useCrudReset } from "@/hooks/useCrudReset";
import { useI18n } from "@/i18n";
import type { TranslationKey } from "@/i18n";
import { mensagemErroApi } from "@/i18n/apiMessages";
import { useFilialId } from "@/auth/FilialContext";
import {
  abrirCaixaSessao,
  buscarCaixaSessao,
  fecharCaixaSessao,
  listarCaixaMovimentacoes,
  listarCaixas,
  listarFinalizadores,
  transferirCaixa,
  type Caixa,
  type CaixaMovimentacao,
  type CaixaSessao,
  type Finalizador,
} from "@/api";
import { formatPyg, slicePage } from "@/format";

const v = (name: string) => `var(${name})`;

type Modo = "abrir" | "fechar" | "transferir" | "movimentos" | null;

export default function CaixaOperacaoPage({ navReset }: { navReset: number }) {
  const { t } = useI18n();
  const idFilial = useFilialId();
  const [caixas, setCaixas] = useState<Caixa[]>([]);
  const [finalizadores, setFinalizadores] = useState<Finalizador[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [erro, setErro] = useState<string | null>(null);
  const [modo, setModo] = useState<Modo>(null);
  const [alvo, setAlvo] = useState<Caixa | null>(null);
  const [sessao, setSessao] = useState<CaixaSessao | null>(null);
  const [valores, setValores] = useState<Record<number, string>>({});
  const [idDestino, setIdDestino] = useState<number | "">("");
  const [observacao, setObservacao] = useState("");
  const [movs, setMovs] = useState<CaixaMovimentacao[]>([]);
  const [salvando, setSalvando] = useState(false);

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

  function valoresBody() {
    return finalizadores
      .map((f) => ({ idFinalizador: f.id, valor: Number((valores[f.id] ?? "").replace(",", ".")) || 0 }))
      .filter((l) => l.valor > 0);
  }

  async function iniciar(caixa: Caixa, next: Modo) {
    setAlvo(caixa);
    setErro(null);
    setObservacao("");
    setValores({});
    setIdDestino("");
    setMovs([]);
    try {
      if (caixa.sessaoAbertaId && next !== "abrir") {
        const atual = await buscarCaixaSessao(caixa.sessaoAbertaId);
        setSessao(atual);
        if (next === "fechar") {
          const preset: Record<number, string> = {};
          for (const s of atual.saldos) preset[s.idFinalizador] = String(s.valor);
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

  function camposValores() {
    return (
      <Section title={t("caixa.conferencia")}>
        <div className="space-y-3">
          {finalizadores.map((f) => (
            <Field key={f.id} label={f.nome}>
              <input className="field font-mono" inputMode="decimal" value={valores[f.id] ?? ""}
                onChange={(e) => setValores((atual) => ({ ...atual, [f.id]: e.target.value }))} />
            </Field>
          ))}
        </div>
      </Section>
    );
  }

  if (modo && alvo) {
    const titulo = modo === "abrir" ? t("caixa.open")
      : modo === "fechar" ? t("caixa.close")
        : modo === "transferir" ? t("caixa.transfer")
          : t("caixa.movements");
    return (
      <div className="space-y-5 max-w-xl">
        <button type="button" className="text-xs cursor-pointer" style={{ color: v("--text-muted") }} onClick={() => setModo(null)}>
          ← {t("common.back")}
        </button>
        <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)", color: v("--text") }}>
          {titulo} · {alvo.nome}
        </h1>
        {sessao && modo !== "abrir" && (
          <p className="text-sm font-mono" style={{ color: v("--text-muted") }}>
            {t("caixa.expected")}: {sessao.saldos.map((s) => `${s.finalizadorNome ?? s.idFinalizador} ${formatPyg(s.valor)}`).join(" · ") || "—"}
          </p>
        )}
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
                    <Td mono>{m.finalizadores.map((f) => `${f.finalizadorNome ?? ""} ${formatPyg(f.valor)}`).join(" · ")}</Td>
                    <Td sub>{m.observacao ?? ""}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!movs.length && <div className="py-12 text-center text-sm" style={{ color: v("--text-muted") }}>{t("common.noRecords")}</div>}
          </div>
        ) : (
          <form className="rounded-lg p-6 space-y-4" style={{ background: v("--card"), border: `1px solid ${v("--border")}` }}
            onSubmit={(e) => {
              e.preventDefault();
              if (modo === "abrir") void salvarAbrir();
              if (modo === "fechar") void salvarFechar();
              if (modo === "transferir") void salvarTransferir();
            }}>
            {erro && <p className="text-sm" style={{ color: "#ef4444" }}>{erro}</p>}
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
            {camposValores()}
            <Field label={t("caixa.note")}>
              <input className="field" value={observacao} onChange={(e) => setObservacao(e.target.value)} />
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-ghost px-4 py-2 text-sm" onClick={() => setModo(null)}>{t("common.cancel")}</button>
              <button type="submit" disabled={salvando} className="btn-gold px-5 py-2 text-sm">{salvando ? t("common.saving") : t("common.save")}</button>
            </div>
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
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("common.search")}
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
                <td className="px-4 py-3 text-right space-x-3">
                  {!e.sessaoAbertaId && (
                    <button className="text-xs cursor-pointer" style={{ color: v("--gold") }} onClick={() => void iniciar(e, "abrir")}>{t("caixa.open")}</button>
                  )}
                  {!!e.sessaoAbertaId && (
                    <>
                      <button className="text-xs cursor-pointer" style={{ color: v("--gold") }} onClick={() => void iniciar(e, "fechar")}>{t("caixa.close")}</button>
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
