import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useI18n } from "@/i18n";
import type { TranslationKey } from "@/i18n";
import { PAGE_SIZE } from "@/format";

const v = (name: string) => `var(${name})`;

export function StatusBadge({
  status,
  onToggle,
  disabled,
}: {
  status: "ativo" | "inativo";
  onToggle?: () => void;
  disabled?: boolean;
}) {
  const { t } = useI18n();
  const ativo = status === "ativo";
  const label = ativo ? t("common.active") : t("common.inactive");
  const className = `status-badge${ativo ? " is-on" : " is-off"}`;
  const inner = (
    <>
      {onToggle && <span className={`status-switch${ativo ? " is-on" : ""}`} aria-hidden />}
      {label}
    </>
  );
  if (!onToggle) {
    return <span className={className}>{inner}</span>;
  }
  return (
    <button
      type="button"
      className={`${className} status-badge-toggle`}
      disabled={disabled}
      aria-pressed={ativo}
      title={ativo ? t("ficha.inactivate") : t("ficha.activate")}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
    >
      {inner}
    </button>
  );
}

export type SortDir = "asc" | "desc";

export type TableCol =
  | TranslationKey
  | ""
  | { label: TranslationKey | ""; sort?: string };

function specCol(col: TableCol, i: number): { label: TranslationKey | ""; sort?: string; key: string } {
  if (typeof col === "string") return { label: col, key: col || `col-${i}` };
  return { label: col.label, sort: col.sort, key: col.sort || col.label || `col-${i}` };
}

export function compararSort(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (typeof a === "boolean" && typeof b === "boolean") return Number(a) - Number(b);
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
}

export function useListSort<T>(
  items: T[],
  valueOf: (item: T, key: string) => unknown,
  defaultKey = "id",
) {
  const [sort, setSort] = useState({ key: defaultKey, dir: "asc" as SortDir });
  const onSort = useCallback((key: string) => {
    setSort((atual) =>
      atual.key === key
        ? { key, dir: atual.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" },
    );
  }, []);
  const sorted = useMemo(() => {
    const copy = [...items];
    copy.sort((a, b) => {
      const cmp = compararSort(valueOf(a, sort.key), valueOf(b, sort.key));
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [items, sort, valueOf]);
  return { items: sorted, sortKey: sort.key, sortDir: sort.dir, onSort };
}

export function Th({ children, ariaSort }: { children: ReactNode; ariaSort?: "ascending" | "descending" | "none" }) {
  return <th className="drive-th" aria-sort={ariaSort}>{children}</th>;
}

export function TableHeadRow({
  cols,
  sortKey,
  sortDir,
  onSort,
}: {
  cols: TableCol[];
  sortKey?: string;
  sortDir?: SortDir;
  onSort?: (key: string) => void;
}) {
  const { t } = useI18n();
  return (
    <tr>
      {cols.map((col, i) => {
        const spec = specCol(col, i);
        const sortable = Boolean(spec.sort && onSort);
        const active = sortable && sortKey === spec.sort;
        const ariaSort = !sortable ? undefined : active ? (sortDir === "desc" ? "descending" : "ascending") : "none";
        return (
          <Th key={spec.key} ariaSort={ariaSort}>
            {sortable ? (
              <button
                type="button"
                className={`drive-th-sort${active ? " is-on" : ""}`}
                onClick={() => onSort!(spec.sort!)}
              >
                {spec.label ? t(spec.label) : ""}
                {active ? <span className="drive-th-caret" aria-hidden>{sortDir === "desc" ? "↓" : "↑"}</span> : null}
              </button>
            ) : (
              spec.label ? t(spec.label) : ""
            )}
          </Th>
        );
      })}
    </tr>
  );
}

export function Td({
  children, mono, gold, sub, nowrap, clip, title, right,
}: {
  children: ReactNode; mono?: boolean; gold?: boolean; sub?: boolean;
  nowrap?: boolean; clip?: boolean; title?: string; right?: boolean;
}) {
  return (
    <td
      className={`drive-td${mono ? " font-mono" : ""}${nowrap ? " drive-td-nowrap" : ""}${clip ? " drive-td-clip" : ""}${right ? " drive-td-right" : ""}`}
      title={title}
      style={{ color: gold ? v("--gold") : sub ? v("--text-muted") : v("--text-sub") }}
    >
      {children}
    </td>
  );
}

export type FiltroStatus = "todos" | "ativo" | "inativo";

export function passaFiltroStatus(status: string | undefined, filtro: FiltroStatus): boolean {
  if (filtro === "todos") return true;
  return (status === "inativo" ? "inativo" : "ativo") === filtro;
}

export function StatusFilter({ value, onChange }: {
  value: FiltroStatus;
  onChange: (v: FiltroStatus) => void;
}) {
  const { t } = useI18n();
  const opcoes: { id: FiltroStatus; label: TranslationKey }[] = [
    { id: "todos", label: "filter.status.all" },
    { id: "ativo", label: "filter.status.active" },
    { id: "inativo", label: "filter.status.inactive" },
  ];
  return (
    <div className="status-filter" role="group" aria-label={t("filter.status.label")}>
      {opcoes.map((o) => (
        <button
          key={o.id}
          type="button"
          className={`status-filter-btn${value === o.id ? " is-on" : ""}`}
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
        >
          {t(o.label)}
        </button>
      ))}
    </div>
  );
}

export function ListToolbar({ children }: { children: ReactNode }) {
  return <div className="list-toolbar">{children}</div>;
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
    <div className="px-4 py-2.5 flex items-center justify-between gap-2" style={{ borderTop: `1px solid ${v("--border")}` }}>
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
