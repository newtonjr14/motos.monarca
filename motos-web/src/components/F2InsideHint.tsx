import { useI18n } from "@/i18n";

const v = (name: string) => `var(${name})`;

/** Dica F2 dentro do trigger de busca — estilo tecla (<kbd>). */
export default function F2InsideHint() {
  const { t } = useI18n();
  return (
    <span
      className="shrink-0 inline-flex items-center gap-1.5"
      title={t("common.f2Search")}
      aria-hidden
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ color: v("--text-muted"), opacity: 0.85 }}
      >
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3.5-3.5" />
      </svg>
      <kbd
        className="text-[10px] font-mono tracking-wide leading-none px-1.5 py-0.5 rounded"
        style={{
          color: v("--text-sub"),
          background: v("--card2"),
          border: `1px solid ${v("--border")}`,
          boxShadow: `0 1px 0 ${v("--border")}`,
        }}
      >
        F2
      </kbd>
    </span>
  );
}
