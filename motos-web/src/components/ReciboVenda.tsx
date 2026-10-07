import type { Venda } from "@/api";
import { formatPyg, formatarDataHoraEpoch, formatMoeda } from "@/format";
import { useI18n } from "@/i18n";
import { useEffect } from "react";
import { createPortal } from "react-dom";

const v = (name: string) => `var(${name})`;
const border1 = () => `1px solid ${v("--border")}`;
const tinta = "#111";
const linha = "#ccc";

function AvisoDav({ t }: { t: (k: "venda.dav.aviso" | "venda.dav.pagamento") => string }) {
  return (
    <div className="px-3 py-2 text-center text-[10px] font-semibold leading-snug" style={{ color: tinta }}>
      <p>{t("venda.dav.aviso")}</p>
      <p>- {t("venda.dav.pagamento")}</p>
    </div>
  );
}

/** DAV (documento auxiliar de venda). A impressão esconde o resto da UI. */
export default function ReciboVenda({
  venda,
  onClose,
}: {
  venda: Venda;
  onClose: () => void;
}) {
  const { t, locale } = useI18n();

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

  const quando = formatarDataHoraEpoch(venda.criadoEm, locale === "es" ? "es-PY" : "pt-BR");

  return createPortal(
    <div
      className="ficha-modal-overlay recibo-overlay fixed inset-0 z-[220] flex items-start justify-center p-4 sm:p-6 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <style>{`@media print { @page { size: A4 portrait; margin: 12mm; } }`}</style>
      <div
        className="ficha-modal w-full max-w-3xl rounded-xl shadow-2xl flex flex-col"
        style={{ background: v("--card"), border: border1() }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dav-folha px-6 py-5" id="recibo-venda" style={{ background: "#fff", color: tinta }}>
          <p className="text-center text-sm font-semibold">{venda.filialNome}</p>
          <div className="mt-3 border" style={{ borderColor: tinta }}>
            <p
              className="text-center text-[11px] font-semibold tracking-wide py-1.5"
              style={{ background: "#e6e6e6", color: tinta }}
            >
              {t("venda.dav.titulo")}
            </p>
            <div style={{ borderTop: `1px solid ${tinta}` }}>
              <AvisoDav t={t} />
            </div>
          </div>

          <div className="mt-3 flex items-baseline justify-between gap-4 text-xs">
            <p className="font-mono font-semibold">#{venda.id}</p>
            <p className="font-mono">{quando}</p>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
            <p><span style={{ color: "#555" }}>{t("venda.client")}:</span> {venda.clienteNome}</p>
            <p><span style={{ color: "#555" }}>{t("venda.seller")}:</span> {venda.vendedorNome}</p>
          </div>

          <table className="mt-3 w-full border-collapse text-xs">
            <thead>
              <tr style={{ background: "#f4f4f4" }}>
                <th className="border px-2 py-1 text-left font-semibold" style={{ borderColor: linha }}>{t("venda.product")}</th>
                <th className="border px-2 py-1 text-right font-semibold" style={{ borderColor: linha }}>{t("venda.qty")}</th>
                <th className="border px-2 py-1 text-right font-semibold" style={{ borderColor: linha }}>{t("venda.unit")}</th>
                <th className="border px-2 py-1 text-right font-semibold" style={{ borderColor: linha }}>{t("venda.total")}</th>
              </tr>
            </thead>
            <tbody>
              {venda.itens.map((item) => (
                <tr key={item.id}>
                  <td className="border px-2 py-1.5" style={{ borderColor: linha }}>
                    <span className="block">{item.produtoNome}</span>
                    <span className="font-mono" style={{ color: "#555" }}>{item.produtoCodigo}</span>
                    {item.chassis && item.chassis.length > 0 && (
                      <span className="block font-mono" style={{ color: "#555" }}>{item.chassis.join(", ")}</span>
                    )}
                    {(item.descontoPct ?? 0) > 0 && (
                      <span className="block" style={{ color: "#555" }}>−{item.descontoPct}%</span>
                    )}
                  </td>
                  <td className="border px-2 py-1.5 text-right font-mono align-top" style={{ borderColor: linha }}>{item.quantidade}</td>
                  <td className="border px-2 py-1.5 text-right font-mono align-top" style={{ borderColor: linha }}>Gs. {formatPyg(item.precoUnitarioPyg)}</td>
                  <td className="border px-2 py-1.5 text-right font-mono align-top" style={{ borderColor: linha }}>Gs. {formatPyg(item.totalPyg)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-3 ml-auto w-full max-w-xs space-y-1 text-sm">
            {(venda.descontoPct ?? 0) > 0 && (
              <div className="flex justify-between text-xs">
                <span style={{ color: "#555" }}>{t("venda.saleDiscount")} {venda.descontoPct}%</span>
                <span className="font-mono">− Gs. {formatPyg(venda.descontoPyg ?? 0)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold">
              <span>{t("venda.total")}</span>
              <span className="font-mono">Gs. {formatPyg(venda.totalPyg)}</span>
            </div>
            {venda.negociacao.map((n) => (
              <div key={n.id} className="flex justify-between text-xs">
                <span style={{ color: "#555" }}>{n.finalizadorNome}</span>
                <span className="font-mono">{formatMoeda(n.valor, n.moeda ?? "pyg")}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 border-t pt-2" style={{ borderColor: tinta }}>
            <AvisoDav t={t} />
          </div>
        </div>

        <div className="recibo-actions px-5 py-3 flex gap-2" style={{ borderTop: border1(), background: v("--card2") }}>
          <button type="button" className="btn-gold flex-1 py-2 text-sm" onClick={() => window.print()}>
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
