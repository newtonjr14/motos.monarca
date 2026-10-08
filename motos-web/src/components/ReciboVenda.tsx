import type { Venda } from "@/api";
import { formatPyg, formatarDataHoraEpoch, formatarDataIso, formatMoeda } from "@/format";
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
  const titulo = venda.status === "orcamento"
    ? t("venda.dav.tituloOrcamento")
    : venda.status === "aberta"
      ? t("venda.dav.tituloAberta")
      : t("venda.dav.titulo");
  const bruto = venda.totalPyg + (venda.descontoPyg ?? 0);

  return createPortal(
    <div
      className="ficha-modal-overlay recibo-overlay fixed inset-0 z-[220] flex items-center justify-center overflow-hidden p-4 sm:p-6"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <style>{`@media print { @page { size: A4 portrait; margin: 12mm; } }`}</style>
      <div
        className="ficha-modal flex w-full max-w-3xl flex-col overflow-hidden rounded-xl shadow-2xl"
        style={{ background: v("--card"), border: border1() }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dav-folha min-h-0 flex-1 overflow-y-auto px-6 py-5" id="recibo-venda" style={{ background: "#fff", color: tinta }}>
          <p className="text-center text-sm font-semibold">{venda.filialNome}</p>
          <div className="mt-3 border" style={{ borderColor: tinta }}>
            <p
              className="text-center text-[11px] font-semibold tracking-wide py-1.5"
              style={{ background: "#e6e6e6", color: tinta }}
            >
              {titulo}
            </p>
            {venda.status === "finalizada" && (
              <div style={{ borderTop: `1px solid ${tinta}` }}>
                <AvisoDav t={t} />
              </div>
            )}
          </div>

          <div className="mt-3 flex items-baseline justify-between gap-4 text-xs">
            <p className="font-mono font-semibold">#{venda.id}</p>
            <p className="font-mono">{quando}</p>
          </div>

          <div className="mt-3 grid gap-1 text-xs">
            <p><span style={{ color: "#555" }}>{t("venda.client")}:</span> {venda.clienteNome}</p>
            {venda.clienteEndereco && (
              <p><span style={{ color: "#555" }}>{t("venda.dav.endereco")}:</span> {venda.clienteEndereco}</p>
            )}
            {venda.clienteTelefone && (
              <p><span style={{ color: "#555" }}>{t("venda.dav.telefone")}:</span> {venda.clienteTelefone}</p>
            )}
            <p><span style={{ color: "#555" }}>{t("venda.seller")}:</span> {venda.vendedorNome}</p>
            {venda.status === "orcamento" && venda.validade && (
              <p><span style={{ color: "#555" }}>{t("venda.validade")}:</span> {formatarDataIso(venda.validade)}</p>
            )}
          </div>

          <table className="mt-3 w-full border-collapse text-xs">
            <colgroup>
              <col style={{ width: "56%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "18%" }} />
            </colgroup>
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
                  <td className="border px-2 py-1 align-top" style={{ borderColor: linha }}>
                    <span className="block leading-tight">{item.produtoNome}</span>
                    <span className="block font-mono text-[10px] leading-tight" style={{ color: "#666" }}>
                      {item.produtoCodigo}
                      {(item.descontoPct ?? 0) > 0 ? ` · −${item.descontoPct}%` : ""}
                    </span>
                    {item.chassis && item.chassis.length > 0 && (
                      <span className="block font-mono text-[10px] leading-tight" style={{ color: "#666" }}>{item.chassis.join(" · ")}</span>
                    )}
                  </td>
                  <td className="border px-2 py-1 text-right font-mono align-top whitespace-nowrap" style={{ borderColor: linha }}>{item.quantidade}</td>
                  <td className="border px-2 py-1 text-right font-mono align-top whitespace-nowrap" style={{ borderColor: linha }}>Gs. {formatPyg(item.precoUnitarioPyg)}</td>
                  <td className="border px-2 py-1 text-right font-mono align-top whitespace-nowrap" style={{ borderColor: linha }}>Gs. {formatPyg(item.totalPyg)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 border-t pt-3 space-y-2 text-xs" style={{ borderColor: tinta }}>
            {venda.observacao && (
              <p><span style={{ color: "#555" }}>{t("caixa.note")}:</span> {venda.observacao}</p>
            )}
            <div className="ml-auto w-full max-w-xs space-y-1 text-sm">
              {(venda.descontoPyg ?? 0) > 0 && (
                <>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: "#555" }}>{t("venda.subtotal")}</span>
                    <span className="font-mono whitespace-nowrap">Gs. {formatPyg(bruto)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: "#555" }}>{t("venda.saleDiscount")} {venda.descontoPct}%</span>
                    <span className="font-mono whitespace-nowrap">− Gs. {formatPyg(venda.descontoPyg ?? 0)}</span>
                  </div>
                </>
              )}
              <div className="flex items-start justify-between gap-4 font-semibold">
                <span>{t("venda.total")}</span>
                <div className="grid grid-cols-[3rem_auto] justify-items-end gap-x-2 font-mono text-sm">
                  <span>Gs.</span>
                  <span className="whitespace-nowrap">{formatPyg(venda.totalPyg)}</span>
                  {venda.usdPyg ? (
                    <>
                      <span className="font-normal" style={{ color: "#555" }}>US$</span>
                      <span className="whitespace-nowrap font-normal" style={{ color: "#555" }}>
                        {(venda.totalPyg / venda.usdPyg).toLocaleString("es-PY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </>
                  ) : null}
                  {venda.brlPyg ? (
                    <>
                      <span className="font-normal" style={{ color: "#555" }}>R$</span>
                      <span className="whitespace-nowrap font-normal" style={{ color: "#555" }}>
                        {(venda.totalPyg / venda.brlPyg).toLocaleString("es-PY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </>
                  ) : null}
                </div>
              </div>
              {venda.negociacao.length > 0 && (
                <div className="space-y-1 border-t pt-2" style={{ borderColor: linha }}>
                  {venda.negociacao.map((n) => (
                    <div key={n.id} className="flex justify-between gap-4 text-xs">
                      <span style={{ color: "#555" }}>{n.finalizadorNome}{n.quantidadeParcelas ? ` ${n.quantidadeParcelas}x` : ""}</span>
                      <span className="whitespace-nowrap font-mono">{formatMoeda(n.valor, n.moeda ?? "pyg")}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="pt-2 text-center text-[11px]" style={{ color: "#333" }}>{t("venda.dav.concordo")}</p>
          </div>
        </div>

        <div className="recibo-actions flex shrink-0 gap-2 px-5 py-3" style={{ borderTop: border1(), background: v("--card2") }}>
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
