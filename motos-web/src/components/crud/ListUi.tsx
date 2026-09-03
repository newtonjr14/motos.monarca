import type { ReactNode } from "react";
import { useI18n } from "@/i18n";
import type { TranslationKey } from "@/i18n";
import { PAGE_SIZE } from "@/format";

const v = (name: string) => `var(${name})`;

export function StatusBadge({ status }: { status: "ativo" | "inativo" }) {
  const { t } = useI18n();
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border whitespace-nowrap"
      style={{
        background: status === "ativo" ? "var(--success-bg)" : "rgba(148,163,184,0.1)",
        borderColor: status === "ativo" ? "var(--success-border)" : "rgba(148,163,184,0.2)",
        color: status === "ativo" ? "var(--success)" : v("--text-muted"),
      }}
    >
      {status === "ativo" ? t("common.active") : t("common.inactive")}
    </span>
  );
}

export function Th({ children }: { children: ReactNode }) {
  return <th className="drive-th">{children}</th>;
}

export function TableHeadRow({ cols }: { cols: (TranslationKey | "")[] }) {
  const { t } = useI18n();
  return (
    <tr>
      {cols.map((key, i) => (
        <Th key={key || `col-${i}`}>{key ? t(key) : ""}</Th>
      ))}
    </tr>
  );
}

export function Td({
  children, mono, gold, sub, nowrap, clip, title,
}: {
  children: ReactNode; mono?: boolean; gold?: boolean; sub?: boolean;
  nowrap?: boolean; clip?: boolean; title?: string;
}) {
  return (
    <td
      className={`drive-td${mono ? " font-mono" : ""}${nowrap ? " drive-td-nowrap" : ""}${clip ? " drive-td-clip" : ""}`}
      title={title}
      style={{ color: gold ? v("--gold") : sub ? v("--text-muted") : v("--text-sub") }}
    >
      {children}
    </td>
  );
}

export function TablePagination({ page, total, onPageChange }: {
  page: number; total: number; onPageChange: (p: number) => void;
}) {
  const { t } = useI18n();
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const from = total === 0 ? 0 : (pageSafe - 1) * PAGE_SIZE + 1;
  const to = Math.min(pageSafe * PAGE_SIZE, total);
  return (
    <div className="px-4 py-3 flex items-center justify-between gap-2" style={{ borderTop: `1px solid ${v("--border")}` }}>
      <p className="text-xs" style={{ color: v("--text-muted") }}>
        {t("common.showing")} {from}–{to} {t("common.of")} {total}
      </p>
      <div className="flex gap-1">
        <button type="button" className="btn-ghost px-2 py-1 text-xs" disabled={pageSafe <= 1}
          onClick={() => onPageChange(Math.max(1, pageSafe - 1))}>{t("common.previous")}</button>
        <button type="button" className="btn-ghost px-2 py-1 text-xs" disabled={pageSafe >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, pageSafe + 1))}>{t("common.next")}</button>
      </div>
    </div>
  );
}

export function CatalogHeader({ titulo, count, novoLabel, onNovo }: {
  titulo: string; count: number; novoLabel: string; onNovo: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)", color: v("--text") }}>{titulo}</h1>
        <p className="text-sm mt-0.5" style={{ color: v("--text-muted") }}>{count} {t("common.registered")}</p>
      </div>
      <button className="btn-gold px-4 py-2 text-sm" onClick={onNovo}>{novoLabel}</button>
    </div>
  );
}
