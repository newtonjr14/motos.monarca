import {
  baixarPagamento,
  baixarRecebimento,
  type Caixa,
  type Cotacao,
  type Finalizador,
  type Moeda,
  type ParcelaTitulo,
  type TituloPagar,
  type TituloReceber,
} from "@/api";
import { Field } from "@/components/crud/Field";
import { Td } from "@/components/crud/ListUi";
import {
  converterMoeda,
  formatarDataIso,
  formatMoeda,
} from "@/format";
import { useI18n } from "@/i18n";
import type { TranslationKey } from "@/i18n";
import { mensagemErroApi } from "@/i18n/apiMessages";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

const v = (name: string) => `var(${name})`;
const border1 = () => `1px solid ${v("--border")}`;

function NavBtn({ label, disabled, onClick, children }: {
  label: string; disabled?: boolean; onClick: () => void; children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="shrink-0 w-8 h-8 flex items-center justify-center rounded-md cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
      style={{ color: v("--text-muted"), background: v("--card2"), border: border1() }}
    >
      {children}
    </button>
  );
}

function parcelaAberta(p: ParcelaTitulo) {
  return p.saldo > 0 && p.status !== "paga" && p.status !== "cancelada";
}

type FiltroParcela = "abertas" | "pagas" | "todas";

function arredondarMoeda(n: number, moeda: Moeda): number {
  if (!Number.isFinite(n)) return 0;
  if (moeda === "pyg") return Math.round(n);
  return Math.round(n * 100) / 100;
}

function textoAjuste(n: number, moeda: Moeda, vazioSeZero = true): string {
  if (!Number.isFinite(n) || n < 0) return "";
  if (n === 0) return vazioSeZero ? "" : moeda === "pyg" ? "0" : "0.00";
  if (moeda === "pyg") return String(Math.round(n));
  return (Math.round(n * 100) / 100).toFixed(2);
}

function moedaCurta(moeda: Moeda, t: (key: TranslationKey) => string): string {
  if (moeda === "pyg") return t("venda.currency.pyg");
  if (moeda === "brl") return t("venda.currency.brl");
  return t("venda.currency.usd");
}

function AjusteLinha({
  label, pct, valorTxt, moedaLabel, onPct, onValor, onBlurValor,
}: {
  label: string;
  pct: number;
  valorTxt: string;
  moedaLabel: string;
  onPct: (raw: string) => void;
  onValor: (raw: string) => void;
  onBlurValor: () => void;
}) {
  return (
    <div className="titulo-ajuste">
      <span className="titulo-ajuste-label">{label}</span>
      <label className="pdv-discount">
        <input
          inputMode="decimal"
          aria-label={`${label} %`}
          value={pct === 0 ? "" : String(pct)}
          placeholder="0"
          onChange={(e) => onPct(e.target.value)}
        />
        <span>%</span>
        <input
          className="pdv-discount-value"
          inputMode="decimal"
          aria-label={label}
          value={valorTxt}
          placeholder="0"
          onChange={(e) => onValor(e.target.value)}
          onBlur={onBlurValor}
        />
        <span>{moedaLabel}</span>
      </label>
    </div>
  );
}

function Equivalentes({
  valor,
  moeda,
  usdPyg,
  brlPyg,
}: {
  valor: number;
  moeda: Moeda;
  usdPyg: number;
  brlPyg: number;
}) {
  const cotacao = { usdPyg, brlPyg } as Cotacao;
  const pyg = converterMoeda(valor, moeda, "pyg", cotacao);
  const usd = converterMoeda(valor, moeda, "usd", cotacao);
  const brl = converterMoeda(valor, moeda, "brl", cotacao);
  return (
    <p className="text-[11px] font-mono leading-relaxed" style={{ color: v("--text-muted") }}>
      {formatMoeda(pyg, "pyg")} · {formatMoeda(usd, "usd")} · {formatMoeda(brl, "brl")}
    </p>
  );
}

export default function TituloFicha({
  modo,
  item,
  finalizadores,
  caixas,
  nav,
  onClose,
  onUpdated,
}: {
  modo: "receber" | "pagar";
  item: TituloReceber | TituloPagar;
  finalizadores: Finalizador[];
  caixas: Caixa[];
  nav?: { index: number; total: number; onPrev: () => void; onNext: () => void };
  onClose: () => void;
  onUpdated: (atualizado: TituloReceber | TituloPagar) => Promise<void>;
}) {
  const { t } = useI18n();
  const nome = modo === "receber"
    ? (item as TituloReceber).clienteNome
    : (item as TituloPagar).fornecedorNome;
  const caixasAbertos = caixas.filter((c) => c.sessaoAbertaId);
  const [selecionadas, setSelecionadas] = useState<number[]>([]);
  const [painelBaixa, setPainelBaixa] = useState(false);
  const [baixaValor, setBaixaValor] = useState("");
  const [baixaFin, setBaixaFin] = useState<number | "">("");
  const [baixaSessao, setBaixaSessao] = useState<number | "">("");
  const [baixaMoeda, setBaixaMoeda] = useState<Moeda>(item.moeda);
  const [filtroParcela, setFiltroParcela] = useState<FiltroParcela>("abertas");
  const [descPct, setDescPct] = useState(0);
  const [acrPct, setAcrPct] = useState(0);
  const [descTxt, setDescTxt] = useState("");
  const [acrTxt, setAcrTxt] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    setSelecionadas([]);
    setPainelBaixa(false);
    setErro(null);
    setFiltroParcela("abertas");
    setDescPct(0);
    setAcrPct(0);
    setDescTxt("");
    setAcrTxt("");
    setBaixaMoeda(item.moeda);
    setBaixaFin(finalizadores[0]?.id ?? "");
    setBaixaSessao(caixasAbertos.find((c) => c.padrao)?.sessaoAbertaId ?? caixasAbertos[0]?.sessaoAbertaId ?? "");
  }, [item.id]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        if (painelBaixa) {
          setPainelBaixa(false);
          setErro(null);
          return;
        }
        onClose();
        return;
      }
      if (painelBaixa) return;
      if (nav && !salvando) {
        if (e.key === "ArrowUp" && nav.index > 0) {
          e.preventDefault();
          nav.onPrev();
        }
        if (e.key === "ArrowDown" && nav.index < nav.total - 1) {
          e.preventDefault();
          nav.onNext();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, nav, salvando, painelBaixa]);

  const abertas = useMemo(() => item.parcelas.filter(parcelaAberta), [item.parcelas]);
  const parcelasVisiveis = useMemo(() => item.parcelas.filter((p) => {
    if (filtroParcela === "todas") return true;
    if (filtroParcela === "pagas") return p.status === "paga";
    return parcelaAberta(p);
  }), [item.parcelas, filtroParcela]);
  const abertasVisiveis = useMemo(() => parcelasVisiveis.filter(parcelaAberta), [parcelasVisiveis]);
  const parcelasSel = useMemo(
    () => item.parcelas.filter((p) => selecionadas.includes(p.id)),
    [item.parcelas, selecionadas],
  );
  const saldoSelecionado = parcelasSel.reduce((acc, p) => acc + p.saldo, 0);
  const cotacao = { usdPyg: item.usdPyg, brlPyg: item.brlPyg } as Cotacao;

  function saldoNa(moeda: Moeda) {
    return arredondarMoeda(converterMoeda(saldoSelecionado, item.moeda, moeda, cotacao), moeda);
  }

  function ajusteDe(desc: number, acr: number, moeda: Moeda) {
    const saldo = saldoNa(moeda);
    const descValor = arredondarMoeda(saldo * desc / 100, moeda);
    const acrValor = arredondarMoeda(saldo * acr / 100, moeda);
    const liquido = arredondarMoeda(Math.max(0, saldo - descValor + acrValor), moeda);
    return { saldo, descValor, acrValor, liquido };
  }

  const ajuste = ajusteDe(descPct, acrPct, baixaMoeda);
  const temAjuste = descPct > 0 || acrPct > 0;
  const valorDigitado = Number(baixaValor.replace(",", ".")) || 0;
  const tolMoeda = baixaMoeda === "pyg" ? 1 : 0.02;
  const valorConfere = !temAjuste || Math.abs(valorDigitado - ajuste.liquido) <= tolMoeda;

  function aplicarAjuste(desc: number, acr: number, moeda: Moeda) {
    const d = Math.min(100, Math.max(0, Math.round(desc * 100) / 100));
    const a = Math.min(100, Math.max(0, Math.round(acr * 100) / 100));
    const calc = ajusteDe(d, a, moeda);
    setDescPct(d);
    setAcrPct(a);
    setDescTxt(d <= 0 ? "" : textoAjuste(calc.descValor, moeda));
    setAcrTxt(a <= 0 ? "" : textoAjuste(calc.acrValor, moeda));
    setBaixaValor(textoAjuste(calc.liquido, moeda, false));
  }

  function mudarValorAjuste(qual: "desc" | "acr", raw: string) {
    const limpo = raw.replace(",", ".").replace(/[^\d.]/g, "");
    if (qual === "desc") setDescTxt(limpo);
    else setAcrTxt(limpo);
    const n = Number.parseFloat(limpo);
    const saldo = saldoNa(baixaMoeda);
    if (!limpo || !Number.isFinite(n) || n <= 0 || saldo <= 0) {
      aplicarAjuste(qual === "desc" ? 0 : descPct, qual === "acr" ? 0 : acrPct, baixaMoeda);
      if (qual === "desc") setDescTxt(limpo);
      else setAcrTxt(limpo);
      return;
    }
    const pct = Math.min(100, Math.round((Math.min(saldo, n) / saldo) * 10000) / 100);
    const desc = qual === "desc" ? pct : descPct;
    const acr = qual === "acr" ? pct : acrPct;
    const calc = ajusteDe(desc, acr, baixaMoeda);
    setDescPct(desc);
    setAcrPct(acr);
    setBaixaValor(textoAjuste(calc.liquido, baixaMoeda, false));
  }

  function toggleParcela(id: number) {
    const p = item.parcelas.find((x) => x.id === id);
    if (!p || !parcelaAberta(p)) return;
    setSelecionadas((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleTodas() {
    const ids = abertasVisiveis.map((p) => p.id);
    const todos = ids.length > 0 && ids.every((id) => selecionadas.includes(id));
    if (todos) setSelecionadas((prev) => prev.filter((id) => !ids.includes(id)));
    else setSelecionadas((prev) => [...new Set([...prev, ...ids])]);
  }

  function abrirBaixa() {
    if (selecionadas.length === 0) {
      setErro(t("titulo.error.selecioneParcelas"));
      return;
    }
    setErro(null);
    setDescPct(0);
    setAcrPct(0);
    setDescTxt("");
    setAcrTxt("");
    setBaixaMoeda(item.moeda);
    setBaixaValor(textoAjuste(arredondarMoeda(saldoSelecionado, item.moeda), item.moeda, false));
    setBaixaFin(finalizadores[0]?.id ?? "");
    setBaixaSessao(caixasAbertos.find((c) => c.padrao)?.sessaoAbertaId ?? caixasAbertos[0]?.sessaoAbertaId ?? "");
    setPainelBaixa(true);
  }

  async function confirmarBaixa() {
    if (selecionadas.length === 0 || baixaFin === "") return;
    const vlr = Number(baixaValor.replace(",", ".")) || 0;
    if (vlr < 0 || (vlr <= 0 && ajuste.liquido > tolMoeda)) {
      setErro(t("titulo.error.valor"));
      return;
    }
    if (temAjuste && Math.abs(vlr - ajuste.liquido) > tolMoeda) {
      setErro(`${t("titulo.ajusteValor")} ${formatMoeda(ajuste.liquido, baixaMoeda)}`);
      return;
    }
    setSalvando(true);
    setErro(null);
    try {
      const body = {
        idsParcelas: selecionadas,
        idFinalizador: baixaFin,
        idCaixaSessao: baixaSessao === "" ? null : baixaSessao,
        moeda: baixaMoeda,
        valor: vlr,
        desconto: temAjuste ? ajuste.descValor : 0,
        acrescimo: temAjuste ? ajuste.acrValor : 0,
      };
      const atualizado = modo === "receber"
        ? await baixarRecebimento(body)
        : await baixarPagamento(body);
      setSelecionadas([]);
      setPainelBaixa(false);
      await onUpdated(atualizado);
    } catch (e) {
      setErro(mensagemErroApi(e, t, "common.error.saveFailed"));
    } finally {
      setSalvando(false);
    }
  }

  const acaoBaixa = modo === "receber" ? t("titulo.receberSelecionadas") : t("titulo.pagarSelecionadas");

  return (
    <>
    {createPortal(
    <div
      className="ficha-modal-overlay fixed inset-0 z-[200] flex items-start justify-center p-4 sm:p-6 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-ficha-title"
    >
      <div
        className="ficha-modal ficha-modal-locked w-full max-w-3xl rounded-xl shadow-2xl flex flex-col"
        style={{ background: v("--card"), border: border1() }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ficha-modal-header px-6 py-4 flex items-start justify-between gap-4 shrink-0" style={{ borderBottom: border1() }}>
          <div className="min-w-0 space-y-2">
            <p id="titulo-ficha-title" className="text-lg font-semibold leading-snug truncate" style={{ fontFamily: "var(--font-display)", color: v("--text") }}>
              {nome}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs" style={{ color: v("--text-sub") }}>
                {t(`titulo.status.${item.status}` as TranslationKey)} · {formatMoeda(item.valor, item.moeda)}
              </span>
            </div>
            <Equivalentes valor={item.valor} moeda={item.moeda} usdPyg={item.usdPyg} brlPyg={item.brlPyg} />
            <p className="text-[11px]" style={{ color: v("--text-muted") }}>
              {t("titulo.cotacaoTravada")}: USD {item.usdPyg} / BRL {item.brlPyg}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {nav && nav.total > 1 && (
              <>
                <NavBtn label={t("ficha.prev")} disabled={nav.index <= 0} onClick={nav.onPrev}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                </NavBtn>
                <span className="text-xs tabular-nums px-1 min-w-[3rem] text-center" style={{ color: v("--text-muted") }}>
                  {nav.index + 1} / {nav.total}
                </span>
                <NavBtn label={t("ficha.next")} disabled={nav.index >= nav.total - 1} onClick={nav.onNext}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                </NavBtn>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-md cursor-pointer text-lg leading-none"
              style={{ color: v("--text-muted"), background: v("--card2"), border: border1() }}
              aria-label={t("ficha.close")}
            >
              ×
            </button>
          </div>
        </div>

        <div className="ficha-modal-body px-6 py-5 space-y-4">
          {erro && !painelBaixa && <p className="text-sm" style={{ color: "#ef4444" }}>{erro}</p>}

          <div className="status-filter" role="group" aria-label={t("filter.status.label")}>
            {([
              ["abertas", "titulo.filtro.abertas"],
              ["pagas", "titulo.filtro.pagas"],
              ["todas", "filter.status.all"],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`status-filter-btn${filtroParcela === id ? " is-on" : ""}`}
                aria-pressed={filtroParcela === id}
                onClick={() => setFiltroParcela(id)}
              >
                {t(label)}
              </button>
            ))}
          </div>

          <div className="rounded-lg overflow-hidden" style={{ border: border1() }}>
            <table className="drive-table w-full">
              <thead>
                <tr>
                  <th className="w-10">
                    {abertasVisiveis.length > 0 && (
                      <input
                        type="checkbox"
                        checked={abertasVisiveis.every((p) => selecionadas.includes(p.id))}
                        onChange={toggleTodas}
                        aria-label={t("titulo.selecionarTodas")}
                      />
                    )}
                  </th>
                  <th>#</th>
                  <th>{t("titulo.vencimento")}</th>
                  <th>{t("titulo.valor")}</th>
                  <th>{t("titulo.saldo")}</th>
                  <th>{t("common.status")}</th>
                </tr>
              </thead>
              <tbody>
                {parcelasVisiveis.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-sm py-6 text-center" style={{ color: v("--text-muted") }}>
                      {t("titulo.filtro.vazio")}
                    </td>
                  </tr>
                )}
                {parcelasVisiveis.map((p) => {
                  const aberta = parcelaAberta(p);
                  const checked = selecionadas.includes(p.id);
                  return (
                    <tr
                      key={p.id}
                      className={aberta ? "drive-row-clickable" : undefined}
                      onClick={() => aberta && toggleParcela(p.id)}
                    >
                      <Td>
                        {aberta ? (
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleParcela(p.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : null}
                      </Td>
                      <Td>{p.numero}</Td>
                      <Td>{formatarDataIso(p.vencimento)}</Td>
                      <Td>
                        <div className="space-y-0.5">
                          <span className="font-mono text-sm">{formatMoeda(p.valor, item.moeda)}</span>
                          <Equivalentes valor={p.valor} moeda={item.moeda} usdPyg={item.usdPyg} brlPyg={item.brlPyg} />
                        </div>
                      </Td>
                      <Td>
                        <div className="space-y-0.5">
                          <span className="font-mono text-sm">{formatMoeda(p.saldo, item.moeda)}</span>
                          {p.saldo > 0 && (
                            <Equivalentes valor={p.saldo} moeda={item.moeda} usdPyg={item.usdPyg} brlPyg={item.brlPyg} />
                          )}
                        </div>
                      </Td>
                      <Td>{t(`titulo.parcela.${p.status}` as TranslationKey)}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {selecionadas.length > 0 && (
            <div className="rounded-md px-3 py-2 space-y-1" style={{ background: v("--card2"), border: border1() }}>
              <p className="text-sm" style={{ color: v("--text") }}>
                {t("titulo.selecionadas")}: {selecionadas.length} · {t("titulo.saldo")}:{" "}
                <span className="font-mono">{formatMoeda(saldoSelecionado, item.moeda)}</span>
              </p>
              <Equivalentes valor={saldoSelecionado} moeda={item.moeda} usdPyg={item.usdPyg} brlPyg={item.brlPyg} />
              <p className="text-[11px]" style={{ color: v("--text-muted") }}>{t("titulo.fifoHint")}</p>
            </div>
          )}

        </div>

        <div className="ficha-modal-actions px-6 py-3 shrink-0" style={{ borderTop: border1(), background: v("--card2") }}>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              className="btn-gold flex-1 py-2 text-sm"
              disabled={abertas.length === 0 || salvando}
              onClick={abrirBaixa}
            >
              {modo === "receber" ? t("titulo.receberSelecionadas") : t("titulo.pagarSelecionadas")}
            </button>
            <button type="button" className="btn-ghost flex-1 py-2 text-sm" onClick={onClose}>
              {t("ficha.close")}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
    )}
    {painelBaixa && createPortal(
      <div
        className="pdv-def-overlay"
        style={{ zIndex: 230 }}
        onClick={() => { setPainelBaixa(false); setErro(null); }}
        role="dialog"
        aria-modal="true"
        aria-label={acaoBaixa}
      >
        <div className="pdv-def-dialog titulo-baixa-dialog" onClick={(e) => e.stopPropagation()}>
          <div className="pdv-def-head">
            <div className="min-w-0">
              <h2 className="pdv-cart-title">{acaoBaixa}</h2>
              <p className="text-xs mt-0.5" style={{ color: v("--text-muted") }}>
                {t("titulo.selecionadas")}: {selecionadas.length} · {t("titulo.saldo")}:{" "}
                <span className="font-mono">{formatMoeda(saldoSelecionado, item.moeda)}</span>
              </p>
              <Equivalentes valor={saldoSelecionado} moeda={item.moeda} usdPyg={item.usdPyg} brlPyg={item.brlPyg} />
            </div>
            <button
              type="button"
              onClick={() => { setPainelBaixa(false); setErro(null); }}
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-md cursor-pointer text-lg leading-none"
              style={{ color: v("--text-muted"), background: v("--card2"), border: border1() }}
              aria-label={t("common.cancel")}
            >
              ×
            </button>
          </div>
          <div className="pdv-def-body">
            {erro && <p className="text-sm" style={{ color: "#ef4444" }}>{erro}</p>}
            <Field label={t("finalizador.type")}>
              <select
                className="field"
                value={baixaFin === "" ? "" : String(baixaFin)}
                onChange={(e) => setBaixaFin(e.target.value ? Number(e.target.value) : "")}
              >
                {finalizadores.map((f) => (
                  <option key={f.id} value={f.id}>{f.nome}</option>
                ))}
              </select>
            </Field>
            <Field label={t("nav.caixa")}>
              <select
                className="field"
                value={baixaSessao === "" ? "" : String(baixaSessao)}
                onChange={(e) => setBaixaSessao(e.target.value ? Number(e.target.value) : "")}
              >
                {caixasAbertos.map((c) => (
                  <option key={c.id} value={c.sessaoAbertaId!}>{c.nome}</option>
                ))}
              </select>
            </Field>
            <Field label={t("titulo.moeda")}>
              <select
                className="field"
                value={baixaMoeda}
                onChange={(e) => {
                  const moeda = e.target.value as Moeda;
                  setBaixaMoeda(moeda);
                  aplicarAjuste(descPct, acrPct, moeda);
                }}
              >
                <option value="pyg">Gs.</option>
                <option value="usd">US$</option>
                <option value="brl">R$</option>
              </select>
            </Field>
            <AjusteLinha
              label={t("titulo.desconto")}
              pct={descPct}
              valorTxt={descTxt}
              moedaLabel={moedaCurta(baixaMoeda, t)}
              onPct={(raw) => {
                const limpo = raw.replace(",", ".").replace(/[^\d.]/g, "");
                const n = Number.parseFloat(limpo);
                const pct = !Number.isFinite(n) || limpo === "" ? 0 : Math.min(100, Math.max(0, Math.round(n * 100) / 100));
                aplicarAjuste(pct, acrPct, baixaMoeda);
              }}
              onValor={(raw) => mudarValorAjuste("desc", raw)}
              onBlurValor={() => setDescTxt(descPct <= 0 ? "" : textoAjuste(ajuste.descValor, baixaMoeda))}
            />
            <AjusteLinha
              label={t("titulo.acrescimo")}
              pct={acrPct}
              valorTxt={acrTxt}
              moedaLabel={moedaCurta(baixaMoeda, t)}
              onPct={(raw) => {
                const limpo = raw.replace(",", ".").replace(/[^\d.]/g, "");
                const n = Number.parseFloat(limpo);
                const pct = !Number.isFinite(n) || limpo === "" ? 0 : Math.min(100, Math.max(0, Math.round(n * 100) / 100));
                aplicarAjuste(descPct, pct, baixaMoeda);
              }}
              onValor={(raw) => mudarValorAjuste("acr", raw)}
              onBlurValor={() => setAcrTxt(acrPct <= 0 ? "" : textoAjuste(ajuste.acrValor, baixaMoeda))}
            />
            <Field label={t("titulo.valor")}>
              <input
                className="field font-mono"
                inputMode="decimal"
                autoFocus
                value={baixaValor}
                onFocus={(e) => e.currentTarget.select()}
                onMouseUp={(e) => e.preventDefault()}
                onChange={(e) => setBaixaValor(e.target.value.replace(/[^\d.,]/g, ""))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && valorConfere) {
                    e.preventDefault();
                    void confirmarBaixa();
                  }
                }}
              />
              {valorDigitado > 0 && (
                <Equivalentes valor={valorDigitado} moeda={baixaMoeda} usdPyg={item.usdPyg} brlPyg={item.brlPyg} />
              )}
              {temAjuste && (
                <p className="titulo-quita" style={{ color: valorConfere ? "var(--success)" : "#ef4444" }}>
                  {valorConfere
                    ? `${t("titulo.quitaSaldo")} ${formatMoeda(saldoSelecionado, item.moeda)}`
                    : `${t("titulo.ajusteValor")} ${formatMoeda(ajuste.liquido, baixaMoeda)}`}
                </p>
              )}
            </Field>
          </div>
          <div className="pdv-def-foot">
            <button type="button" className="btn-ghost px-4 py-2 text-sm" onClick={() => { setPainelBaixa(false); setErro(null); }}>
              {t("common.cancel")}
            </button>
            <button type="button" className="btn-gold px-5 py-2 text-sm" disabled={salvando || !valorConfere} onClick={() => void confirmarBaixa()}>
              {salvando ? t("common.saving") : acaoBaixa}
            </button>
          </div>
        </div>
      </div>,
      document.body,
    )}
    </>
  );
}
