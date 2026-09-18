import { type Entrada } from "@/api";
import { Section } from "@/components/crud/Field";
import { Td } from "@/components/crud/ListUi";
import { formatarDataIso, formatMoeda, formatPyg } from "@/format";
import { useI18n } from "@/i18n";
import type { TranslationKey } from "@/i18n";
import { useEffect, type ReactNode } from "react";
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

export default function EntradaFicha({
  item,
  nav,
  onClose,
}: {
  item: Entrada;
  nav?: { index: number; total: number; onPrev: () => void; onNext: () => void };
  onClose: () => void;
}) {
  const { t } = useI18n();

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

  const doc =
    item.tipoDocumento === "py_factura"
      ? [item.timbrado, item.establecimiento, item.puntoExpedicion, item.numero].filter(Boolean).join("-")
      : [item.numeroDocumento, item.incoterm].filter(Boolean).join(" · ");

  return createPortal(
    <div
      className="ficha-modal-overlay fixed inset-0 z-[200] flex items-start justify-center p-4 sm:p-6 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="entrada-ficha-title"
    >
      <div
        className="ficha-modal ficha-modal-locked w-full max-w-3xl rounded-xl shadow-2xl flex flex-col"
        style={{ background: v("--card"), border: border1() }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ficha-modal-header px-6 py-4 flex items-start justify-between gap-4 shrink-0" style={{ borderBottom: border1() }}>
          <div className="min-w-0 space-y-2">
            <p id="entrada-ficha-title" className="text-lg font-semibold leading-snug truncate" style={{ fontFamily: "var(--font-display)", color: v("--text") }}>
              {item.fornecedorNome}
            </p>
            <p className="text-xs" style={{ color: v("--text-sub") }}>
              {t(`entrada.tipo.${item.tipoDocumento}` as TranslationKey)} · {formatarDataIso(item.dataEmissao)} · {doc || "—"}
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

        <div className="px-6 py-3 shrink-0" style={{ background: v("--card2"), borderBottom: border1() }}>
          <p className="text-[11px] font-medium uppercase tracking-wide" style={{ color: v("--text-muted") }}>{t("entrada.total")}</p>
          <p className="text-sm font-mono mt-0.5" style={{ color: v("--gold") }}>
            {formatMoeda(item.valor, item.moeda)} · Gs. {formatPyg(item.valorPyg)}
          </p>
          {item.idTituloPagar != null && (
            <p className="text-[11px] mt-1" style={{ color: v("--text-muted") }}>
              {t("entrada.tituloGerado")} #{item.idTituloPagar}
            </p>
          )}
        </div>

        <div className="ficha-modal-body px-6 py-5 space-y-5">
          <Section title={t("entrada.itens")}>
            <div className="rounded-md overflow-hidden" style={{ border: border1() }}>
              <table className="drive-table w-full">
                <thead>
                  <tr>
                    <th>{t("col.code")}</th>
                    <th>{t("common.name")}</th>
                    <th>{t("venda.qty")}</th>
                    <th>{t("titulo.valor")}</th>
                  </tr>
                </thead>
                <tbody>
                  {item.itens.map((i) => (
                    <tr key={i.id}>
                      <Td mono>{i.produtoCodigo}</Td>
                      <td className="drive-td">
                        <p className="text-xs font-medium" style={{ color: v("--text") }}>{i.produtoNome}</p>
                        {i.chassis.length > 0 && (
                          <p className="text-[11px] font-mono break-all" style={{ color: v("--text-muted") }}>{i.chassis.join(" · ")}</p>
                        )}
                      </td>
                      <Td mono>{i.quantidade}</Td>
                      <Td mono>{formatMoeda(i.valor, i.moeda)}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title={t("venda.pay")}>
            <div className="space-y-2">
              {item.negociacao.map((n) => (
                <div key={n.id} className="flex items-baseline justify-between gap-3">
                  <p className="text-sm" style={{ color: v("--text") }}>{n.finalizadorNome}</p>
                  <p className="text-sm font-mono" style={{ color: v("--text-sub") }}>{formatMoeda(n.valor, n.moeda)}</p>
                </div>
              ))}
            </div>
          </Section>
        </div>

        <div className="ficha-modal-actions px-6 py-3 shrink-0" style={{ borderTop: border1(), background: v("--card2") }}>
          <button type="button" className="btn-action-edit w-full py-2 text-sm" onClick={onClose}>{t("ficha.close")}</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
