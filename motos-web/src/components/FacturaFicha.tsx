import { createPortal } from "react-dom";
import { useEffect, useState, type ReactNode } from "react";
import { Section } from "@/components/crud/Field";
import { useI18n } from "@/i18n";
import type { TranslationKey } from "@/i18n";
import { mensagemErroApi } from "@/i18n/apiMessages";
import {
  consultarFactura,
  enviarFactura,
  type Factura,
} from "@/api";
import { formatPyg, formatarDataHoraEpoch } from "@/format";

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

function estadoKey(estado: string): TranslationKey {
  return `factura.estado.${estado}` as TranslationKey;
}

export default function FacturaFicha({
  item,
  nav,
  onClose,
  onAtualizado,
}: {
  item: Factura;
  nav?: { index: number; total: number; onPrev: () => void; onNext: () => void };
  onClose: () => void;
  onAtualizado: (f: Factura) => void;
}) {
  const { t } = useI18n();
  const [atual, setAtual] = useState(item);
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => { setAtual(item); setErro(null); }, [item]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (nav) {
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
  }, [onClose, nav]);

  async function enviar() {
    setBusy(true);
    setErro(null);
    try {
      const f = await enviarFactura(atual.id);
      setAtual(f);
      onAtualizado(f);
    } catch (e) {
      setErro(mensagemErroApi(e, t, "common.error.saveFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function consultar() {
    setBusy(true);
    setErro(null);
    try {
      const f = await consultarFactura(atual.id);
      setAtual(f);
      onAtualizado(f);
    } catch (e) {
      setErro(mensagemErroApi(e, t, "common.error.loadFailed"));
    } finally {
      setBusy(false);
    }
  }

  const podeEnviar = atual.estado === "pendente" || atual.estado === "rechazado";

  return createPortal(
    <div
      className="ficha-modal-overlay fixed inset-0 z-[200] flex items-start justify-center p-4 sm:p-6 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="factura-ficha-title"
    >
      <div
        className="ficha-modal ficha-modal-locked w-full max-w-2xl rounded-xl shadow-2xl flex flex-col"
        style={{ background: v("--card"), border: border1() }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 shrink-0 flex items-start justify-between gap-3" style={{ borderBottom: border1() }}>
          <div className="min-w-0">
            <h2 id="factura-ficha-title" className="text-lg font-semibold" style={{ color: v("--text") }}>
              {t("factura.fichaTitle")} #{atual.id}
            </h2>
            <p className="text-sm mt-1" style={{ color: v("--text-muted") }}>
              {t("factura.venda")} #{atual.idVenda} · {atual.clienteNome}
            </p>
          </div>
          {nav && (
            <div className="flex items-center gap-1 shrink-0">
              <NavBtn label={t("ficha.prev")} disabled={nav.index <= 0} onClick={nav.onPrev}>↑</NavBtn>
              <span className="text-xs px-1" style={{ color: v("--text-muted") }}>{nav.index + 1}/{nav.total}</span>
              <NavBtn label={t("ficha.next")} disabled={nav.index >= nav.total - 1} onClick={nav.onNext}>↓</NavBtn>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {erro && <p className="text-sm" style={{ color: "#ef4444" }}>{erro}</p>}

          <Section title={t("factura.status")}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <p style={{ color: v("--text-muted") }}>{t("factura.estado")}</p>
                <p style={{ color: v("--text") }}>{t(estadoKey(atual.estado))}</p>
              </div>
              <div>
                <p style={{ color: v("--text-muted") }}>{t("factura.cdc")}</p>
                <p className="font-mono text-xs break-all" style={{ color: v("--text") }}>
                  {atual.cdcFormatado || atual.cdc || "—"}
                </p>
              </div>
              <div>
                <p style={{ color: v("--text-muted") }}>{t("factura.referencia")}</p>
                <p className="font-mono text-xs" style={{ color: v("--text") }}>{atual.referencia}</p>
              </div>
              <div>
                <p style={{ color: v("--text-muted") }}>{t("factura.sudtaxId")}</p>
                <p style={{ color: v("--text") }}>{atual.sudtaxId ?? "—"}</p>
              </div>
              <div>
                <p style={{ color: v("--text-muted") }}>{t("factura.total")}</p>
                <p style={{ color: v("--text") }}>{formatPyg(atual.totalPyg)}</p>
              </div>
              <div>
                <p style={{ color: v("--text-muted") }}>{t("factura.atualizado")}</p>
                <p style={{ color: v("--text") }}>{formatarDataHoraEpoch(atual.atualizadoEm)}</p>
              </div>
            </div>
            {atual.mensagem && (
              <p className="text-sm mt-3" style={{ color: v("--text-sub") }}>{atual.mensagem}</p>
            )}
          </Section>

          {atual.payloadEnvio && (
            <Section title={t("factura.payload")}>
              <pre
                className="text-[11px] font-mono p-3 rounded-md overflow-auto max-h-48 whitespace-pre-wrap break-all"
                style={{ background: v("--card2"), border: border1(), color: v("--text-sub") }}
              >
                {(() => {
                  try { return JSON.stringify(JSON.parse(atual.payloadEnvio), null, 2); }
                  catch { return atual.payloadEnvio; }
                })()}
              </pre>
            </Section>
          )}
        </div>

        <div className="ficha-modal-actions px-6 py-3 shrink-0 flex flex-wrap gap-2" style={{ borderTop: border1(), background: v("--card2") }}>
          {podeEnviar && (
            <button type="button" className="btn-gold px-3 py-2 text-sm" disabled={busy} onClick={() => void enviar()}>
              {t("factura.enviar")}
            </button>
          )}
          <button type="button" className="btn-ghost px-3 py-2 text-sm" disabled={busy} onClick={() => void consultar()}>
            {t("factura.consultar")}
          </button>
          <button type="button" className="btn-action-edit flex-1 py-2 text-sm" onClick={onClose}>
            {t("ficha.close")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
