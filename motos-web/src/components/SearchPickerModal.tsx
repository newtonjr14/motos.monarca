import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "@/i18n";

const v = (name: string) => `var(${name})`;
const border1 = () => `1px solid ${v("--border")}`;

export type SearchPickerItem = {
  id: string;
  label: ReactNode;
  selected?: boolean;
};

export default function SearchPickerModal({
  open,
  title,
  searchPlaceholder,
  query,
  onQueryChange,
  items,
  onPick,
  onClose,
  emptyAction,
}: {
  open: boolean;
  title: string;
  searchPlaceholder: string;
  query: string;
  onQueryChange: (q: string) => void;
  items: SearchPickerItem[];
  onPick: (id: string) => void;
  onClose: () => void;
  emptyAction?: { label: string; onClick: () => void };
}) {
  const { t } = useI18n();
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [destaque, setDestaque] = useState(0);

  useEffect(() => {
    if (!open) return;
    setDestaque(0);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const tmr = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => {
      document.body.style.overflow = prev;
      window.clearTimeout(tmr);
    };
  }, [open]);

  useEffect(() => {
    setDestaque(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-idx="${destaque}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [destaque, open, items.length]);

  if (!open) return null;

  function confirmar() {
    const item = items[destaque] ?? items[0];
    if (item) onPick(item.id);
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[220] flex items-start justify-center p-4 sm:p-6 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.5)", paddingTop: "12vh" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        className="w-full max-w-lg rounded-xl shadow-2xl flex flex-col overflow-hidden"
        style={{
          background: v("--card"),
          border: border1(),
          maxHeight: "min(28rem, calc(100vh - 16vh))",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-3.5 flex items-start justify-between gap-3 shrink-0" style={{ borderBottom: border1() }}>
          <div className="min-w-0">
            <p id={titleId} className="text-sm font-medium uppercase tracking-wide" style={{ color: v("--gold") }}>
              {title}
            </p>
            <p className="text-[11px] mt-1" style={{ color: v("--text-muted") }}>
              {t("searchModal.hint")}
            </p>
          </div>
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

        <div className="px-4 pt-3 pb-2 shrink-0">
          <input
            ref={inputRef}
            className="field text-sm"
            placeholder={searchPlaceholder}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                confirmar();
              } else if (e.key === "ArrowDown") {
                e.preventDefault();
                if (items.length === 0) return;
                setDestaque((i) => Math.min(i + 1, items.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                if (items.length === 0) return;
                setDestaque((i) => Math.max(i - 1, 0));
              }
            }}
          />
        </div>

        <ul ref={listRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-2 pb-3">
          {items.length === 0 && (
            <li className="px-3 py-6 text-center space-y-2">
              <p className="text-sm" style={{ color: v("--text-muted") }}>{t("common.noRecords")}</p>
              {emptyAction && (
                <button
                  type="button"
                  className="text-sm font-medium cursor-pointer"
                  style={{ color: v("--gold") }}
                  onClick={emptyAction.onClick}
                >
                  {emptyAction.label}
                </button>
              )}
            </li>
          )}
          {items.map((item, idx) => {
            const ativo = idx === destaque;
            return (
              <li key={item.id === "" ? `__empty-${idx}` : item.id}>
                <button
                  type="button"
                  data-idx={idx}
                  className="w-full text-left px-3 py-2.5 text-sm rounded-md cursor-pointer"
                  style={{
                    color: item.selected ? v("--gold") : v("--text-sub"),
                    background: ativo ? v("--card2") : "transparent",
                  }}
                  onMouseEnter={() => setDestaque(idx)}
                  onClick={() => onPick(item.id)}
                >
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>,
    document.body,
  );
}
