import { type Venda } from "@/api";
import { Section } from "@/components/crud/Field";
import { Td } from "@/components/crud/ListUi";
import { formatarDataHoraEpoch, formatMoeda, formatPyg } from "@/format";
import { useI18n } from "@/i18n";
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

function StatusVendaTexto({ status }: { status: string }) {
  const { t } = useI18n();
  const ok = status !== "cancelada";
  const label = ok ? t("venda.status.finalizada") : t("venda.status.cancelada");
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border"
      style={{
        background: ok ? "var(--success-bg)" : "var(--card2)",
        borderColor: ok ? "var(--success-border)" : "var(--border)",
        color: ok ? "var(--success)" : "var(--text-muted)",
      }}
    >
      {label}
    </span>
  );
}

export default function VendaFicha({
  item,
  nav,
  onClose,
}: {
  item: Venda;
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

  return createPortal(
    <div
      className="ficha-modal-overlay fixed inset-0 z-[200] flex items-start justify-center p-4 sm:p-6 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="venda-ficha-title"
    >
      <div
        className="ficha-modal ficha-modal-locked w-full max-w-2xl rounded-xl shadow-2xl flex flex-col"
        style={{ background: v("--card"), border: border1() }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ficha-modal-header px-6 py-4 flex items-start justify-between gap-4 shrink-0" style={{ borderBottom: border1() }}>
          <div className="min-w-0 space-y-2">
            <p id="venda-ficha-title" className="text-lg font-semibold leading-snug truncate" style={{ fontFamily: "var(--font-display)", color: v("--text") }}>
              {t("venda.view")} #{item.id}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <StatusVendaTexto status={item.status} />
              <span className="text-xs" style={{ color: v("--text-sub") }}>
                {formatarDataHoraEpoch(item.criadoEm)} · {item.filialNome}
              </span>
            </div>
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
          <p className="text-[11px] font-medium uppercase tracking-wide" style={{ color: v("--text-muted") }}>
            {t("venda.total")}
          </p>
          <p className="text-sm font-mono mt-0.5" style={{ color: v("--gold") }}>Gs. {formatPyg(item.totalPyg)}</p>
        </div>

        <div className="ficha-modal-body px-6 py-5 space-y-5">
          <div className="grid gap-5 sm:grid-cols-2 sm:items-start">
            <Section title={t("venda.client")}>
              <p className="text-sm break-words" style={{ color: v("--text") }}>{item.clienteNome}</p>
            </Section>
            <Section title={t("venda.seller")}>
              <p className="text-sm break-words" style={{ color: v("--text") }}>{item.vendedorNome}</p>
            </Section>
          </div>

          <Section title={t("venda.items")}>
            <div className="rounded-md overflow-hidden" style={{ border: border1() }}>
              <table className="drive-table w-full">
                <thead>
                  <tr>
                    <th className="drive-th">{t("col.code")}</th>
                    <th className="drive-th">{t("common.name")}</th>
                    <th className="drive-th">{t("venda.qty")}</th>
                    <th className="drive-th">{t("venda.total")}</th>
                  </tr>
                </thead>
                <tbody>
                  {item.itens.map((i) => (
                    <tr key={i.id} style={{ borderBottom: border1() }}>
                      <Td mono>{i.produtoCodigo}</Td>
                      <td className="drive-td">
                        <p className="text-xs font-medium" style={{ color: v("--text") }}>{i.produtoNome}</p>
                        {i.chassis && i.chassis.length > 0 && (
                          <p className="text-[11px] font-mono break-all" style={{ color: v("--text-muted") }}>{i.chassis.join(" · ")}</p>
                        )}
                        <p className="text-[11px]" style={{ color: v("--text-muted") }}>{i.estoqueNome}</p>
                      </td>
                      <Td mono>{i.quantidade}</Td>
                      <Td mono>Gs. {formatPyg(i.totalPyg)}</Td>
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
                  <p className="text-sm min-w-0 break-words" style={{ color: v("--text") }}>{n.finalizadorNome}</p>
                  <p className="text-sm font-mono shrink-0" style={{ color: v("--text-sub") }}>
                    {formatMoeda(n.valor, n.moeda ?? "pyg")}
                  </p>
                </div>
              ))}
            </div>
          </Section>

          {item.observacao && (
            <Section title={t("caixa.note")}>
              <p className="text-sm leading-relaxed break-words" style={{ color: v("--text") }}>{item.observacao}</p>
            </Section>
          )}
        </div>

        <div className="ficha-modal-actions px-6 py-3 shrink-0" style={{ borderTop: border1(), background: v("--card2") }}>
          <button type="button" className="btn-action-edit w-full py-2 text-sm" onClick={onClose}>
            {t("ficha.close")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
