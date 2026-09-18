import type { Venda } from "@/api";
import { formatPyg, formatarDataHoraEpoch, formatMoeda } from "@/format";
import { useI18n } from "@/i18n";
import { useEffect } from "react";
import { createPortal } from "react-dom";

const v = (name: string) => `var(${name})`;
const border1 = () => `1px solid ${v("--border")}`;

/** Recibo simples (não fiscal) — @media print esconde o resto da UI. */
export default function ReciboVenda({
  venda,
  onClose,
}: {
  venda: Venda;
  onClose: () => void;
}) {
  const { t } = useI18n();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  function imprimir() {
    window.print();
  }

  return createPortal(
    <div
      className="ficha-modal-overlay recibo-overlay fixed inset-0 z-[220] flex items-start justify-center p-4 sm:p-6 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="ficha-modal w-full max-w-sm rounded-xl shadow-2xl flex flex-col"
        style={{ background: v("--card"), border: border1() }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="recibo-print-root px-5 py-4 space-y-3" id="recibo-venda">
          <div className="text-center">
            <p className="text-sm font-semibold" style={{ color: v("--text") }}>{venda.filialNome}</p>
            <p className="text-xs mt-1" style={{ color: v("--text-muted") }}>{t("venda.recibo.title")}</p>
            <p className="text-xs font-mono mt-1" style={{ color: v("--text-sub") }}>
              #{venda.id} · {formatarDataHoraEpoch(venda.criadoEm)}
            </p>
          </div>

          <div className="text-xs space-y-0.5" style={{ color: v("--text-sub") }}>
            <p><span style={{ color: v("--text-muted") }}>{t("venda.client")}:</span> {venda.clienteNome}</p>
            <p><span style={{ color: v("--text-muted") }}>{t("venda.seller")}:</span> {venda.vendedorNome}</p>
          </div>

          <table className="w-full text-xs" style={{ color: v("--text") }}>
            <thead>
              <tr style={{ borderBottom: border1() }}>
                <th className="text-left py-1 font-medium">{t("venda.product")}</th>
                <th className="text-right py-1 font-medium">{t("venda.qty")}</th>
                <th className="text-right py-1 font-medium">{t("venda.total")}</th>
              </tr>
            </thead>
            <tbody>
              {venda.itens.map((item) => (
                <tr key={item.id} style={{ borderBottom: border1() }}>
                  <td className="py-1.5 pr-2">
                    <span className="block">{item.produtoNome}</span>
                    <span className="font-mono" style={{ color: v("--text-muted") }}>{item.produtoCodigo}</span>
                    {(item.descontoPct ?? 0) > 0 && (
                      <span className="block" style={{ color: v("--text-muted") }}>
                        −{item.descontoPct}%
                      </span>
                    )}
                  </td>
                  <td className="py-1.5 text-right font-mono align-top">{item.quantidade}</td>
                  <td className="py-1.5 text-right font-mono align-top">Gs. {formatPyg(item.totalPyg)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="space-y-1 text-sm">
            <div className="flex justify-between font-semibold">
              <span style={{ color: v("--text") }}>{t("venda.total")}</span>
              <span className="font-mono" style={{ color: v("--text") }}>Gs. {formatPyg(venda.totalPyg)}</span>
            </div>
            {venda.negociacao.map((n) => (
              <div key={n.id} className="flex justify-between text-xs">
                <span style={{ color: v("--text-muted") }}>{n.finalizadorNome}</span>
                <span className="font-mono" style={{ color: v("--text-sub") }}>
                  {formatMoeda(n.valor, n.moeda ?? "pyg")}
                </span>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-center pt-2" style={{ color: v("--text-muted") }}>
            {t("venda.recibo.footer")}
          </p>
        </div>

        <div className="recibo-actions px-5 py-3 flex gap-2" style={{ borderTop: border1(), background: v("--card2") }}>
          <button type="button" className="btn-gold flex-1 py-2 text-sm" onClick={imprimir}>
            {t("venda.recibo.print")}
          </button>
          <button type="button" className="btn-ghost flex-1 py-2 text-sm" onClick={onClose}>
            {t("ficha.close")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
