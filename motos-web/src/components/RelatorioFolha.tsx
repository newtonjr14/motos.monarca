import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "@/i18n";

export type FolhaRelatorio = {
  arquivo: string;
  titulo: string;
  empresa: string;
  filtro: string;
  emitidoEm: string;
  secao?: string;
  nota?: string;
  faixas: { label: string; span: number }[];
  colunas: string[];
  linhas: string[][];
  destaques?: number[];
  direita: number[];
  rodapes: { rotulo: string; celulas: string[] }[];
};

function escapar(valor: string): string {
  return valor
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function linhaXml(celulas: string[], negrito = false): string {
  const estilo = negrito ? ` ss:StyleID="negrito"` : "";
  return `<Row>${celulas.map((c) => `<Cell${estilo}><Data ss:Type="String">${escapar(c)}</Data></Cell>`).join("")}</Row>`;
}

function faixasXml(faixas: { label: string; span: number }[]): string {
  return `<Row>${faixas.map((f) => {
    const merge = f.span > 1 ? ` ss:MergeAcross="${f.span - 1}"` : "";
    return `<Cell${merge}><Data ss:Type="String">${escapar(f.label)}</Data></Cell>`;
  }).join("")}</Row>`;
}

export function baixarPlanilha(folha: FolhaRelatorio) {
  const destaques = new Set(folha.destaques ?? []);
  const faixas = folha.faixas.some((f) => f.label) ? faixasXml(folha.faixas) : "";
  const secao = folha.secao
    ? `<Row><Cell${folha.colunas.length > 1 ? ` ss:MergeAcross="${folha.colunas.length - 1}"` : ""} ss:StyleID="negrito"><Data ss:Type="String">${escapar(folha.secao)}</Data></Cell></Row>`
    : "";
  const corpo = [
    linhaXml(folha.colunas, true),
    secao,
    ...folha.linhas.map((linha, i) => linhaXml(linha, destaques.has(i))),
    ...folha.rodapes.map((r) => linhaXml([r.rotulo, ...r.celulas.slice(1)], true)),
  ].join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Styles><Style ss:ID="negrito"><Font ss:Bold="1"/></Style></Styles>
<Worksheet ss:Name="Relatorio"><Table>
${faixas}
${corpo}
</Table></Worksheet></Workbook>`;
  const blob = new Blob([xml], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = folha.arquivo.endsWith(".xls") ? folha.arquivo : `${folha.arquivo}.xls`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function RelatorioFolha({ folha, onClose }: { folha: FolhaRelatorio; onClose: () => void }) {
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

  const direita = new Set(folha.direita);
  const destaques = new Set(folha.destaques ?? []);

  return createPortal(
    <div
      className="relatorio-print-overlay fixed inset-0 z-[230] overflow-y-auto p-4 sm:p-8"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <style>{`@media print { @page { size: A4 landscape; margin: 8mm; } }`}</style>
      <div
        className="relatorio-folha mx-auto w-full max-w-6xl rounded-md"
        style={{ background: "#fff", color: "#111" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relatorio-print-actions flex justify-end gap-2 px-4 pt-3">
          <button type="button" className="btn-ghost px-3 py-1.5 text-xs" onClick={onClose}>{t("common.cancel")}</button>
          <button type="button" className="btn-gold px-4 py-1.5 text-xs" onClick={() => window.print()}>{t("venda.recibo.print")}</button>
        </div>
        <div className="px-5 pb-5">
          <div className="grid grid-cols-3 items-start gap-3 text-[11px]">
            <p className="font-semibold">{folha.empresa}</p>
            <p className="text-center text-sm font-semibold">{folha.titulo}</p>
            <p className="text-right font-mono">{folha.emitidoEm}</p>
          </div>
          <p className="mt-1 text-[10px]" style={{ color: "#555" }}>{folha.filtro}</p>
          <table className="mt-3 w-full border-collapse text-[10px]">
            <thead>
              {folha.faixas.some((f) => f.label) && (
                <tr>
                  {folha.faixas.map((f, i) => (
                    <th
                      key={`${f.label}-${i}`}
                      colSpan={f.span}
                      className="border px-1 py-0.5 text-center font-semibold"
                      style={{ borderColor: "#ccc", background: f.label ? "#f4f4f4" : "transparent" }}
                    >
                      {f.label}
                    </th>
                  ))}
                </tr>
              )}
              <tr>
                {folha.colunas.map((c, i) => (
                  <th
                    key={c}
                    className={`border px-1 py-1 font-semibold ${direita.has(i) ? "text-right" : "text-left"}`}
                    style={{ borderColor: "#ccc", background: "#fafafa" }}
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {folha.secao && (
                <tr>
                  <td colSpan={folha.colunas.length} className="border px-1 py-1 font-semibold" style={{ borderColor: "#ccc" }}>
                    {folha.secao}
                  </td>
                </tr>
              )}
              {folha.linhas.map((linha, ri) => (
                <tr key={ri}>
                  {linha.map((c, i) => (
                    <td
                      key={i}
                      className={`border px-1 py-0.5 font-mono ${destaques.has(ri) ? "font-semibold" : ""} ${direita.has(i) ? "text-right" : "text-left"}`}
                      style={{ borderColor: "#e5e5e5", background: destaques.has(ri) ? "#f7f7f7" : "transparent" }}
                    >
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            {folha.rodapes.length > 0 && (
              <tfoot>
                {folha.rodapes.map((r) => (
                  <tr key={r.rotulo + r.celulas.join("|")}>
                    {r.celulas.map((c, i) => (
                      <td
                        key={i}
                        className={`border px-1 py-0.5 font-semibold font-mono ${direita.has(i) ? "text-right" : "text-left"}`}
                        style={{ borderColor: "#ccc", background: "#f7f7f7" }}
                      >
                        {i === 0 ? r.rotulo : c}
                      </td>
                    ))}
                  </tr>
                ))}
              </tfoot>
            )}
          </table>
          {folha.nota && (
            <p className="mt-2 text-[10px]" style={{ color: "#555" }}>{folha.nota}</p>
          )}
          <p className="mt-2 text-[10px]" style={{ color: "#555" }}>
            {folha.linhas.length - (folha.destaques?.length ?? 0)} · {folha.titulo}
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
