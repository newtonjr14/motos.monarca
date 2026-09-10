const v = (name: string) => `var(${name})`;

const SELETOR_CAMPO =
  "input.field:not([disabled]):not([readonly]), select.field:not([disabled]), textarea.field:not([disabled]), button.field:not([disabled]), input[type=checkbox]:not([disabled])";

function camposVisiveis(panelId: string): HTMLElement[] {
  const panel = document.getElementById(panelId);
  if (!panel || panel.hidden) return [];
  return Array.from(panel.querySelectorAll<HTMLElement>(SELETOR_CAMPO)).filter((el) => el.getClientRects().length > 0);
}

function focarPrimeiroCampo(panelId: string) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      camposVisiveis(panelId)[0]?.focus();
    });
  });
}

/** Tab ou Enter no último campo da guia abre a próxima. Enter nos demais campos avança no formulário. */
export function navegarGuiaNoTeclado<T extends string>(
  e: React.KeyboardEvent,
  tabs: readonly T[],
  value: T,
  onChange: (id: T) => void,
) {
  if (e.shiftKey || (e.key !== "Tab" && e.key !== "Enter")) return;
  const target = e.target as HTMLElement;
  if (e.key === "Enter" && target.tagName === "BUTTON" && !target.classList.contains("field")) return;
  const campos = camposVisiveis(`form-panel-${value}`);
  const idx = campos.indexOf(target);
  if (idx < 0) return;
  const ultimo = idx === campos.length - 1;
  const proxima = tabs[tabs.indexOf(value) + 1];
  if (ultimo && proxima && (e.key === "Tab" || e.key === "Enter")) {
    e.preventDefault();
    onChange(proxima);
    focarPrimeiroCampo(`form-panel-${proxima}`);
    return;
  }
  if (e.key === "Enter" && target.tagName === "TEXTAREA") return;
  if (!ultimo && e.key === "Enter") {
    e.preventDefault();
    campos[idx + 1]?.focus();
  }
}

export function Field({
  label,
  required,
  error,
  hint,
  aside,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  aside?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="text-[13px] font-medium" style={{ color: v("--text-sub") }}>
        {label}{required && <span style={{ color: v("--gold") }}> *</span>}
        {aside ? (
          <span className="ml-1.5 font-normal text-[11px]" style={{ color: v("--text-muted") }}>{aside}</span>
        ) : null}
      </span>
      <div className="mt-1.5">{children}</div>
      {error
        ? <p className="mt-1 text-xs" style={{ color: "#ef4444" }}>{error}</p>
        : hint
          ? <p className="mt-1 text-xs" style={{ color: v("--text-muted") }}>{hint}</p>
          : null}
    </label>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-medium tracking-widest uppercase" style={{ color: v("--gold") }}>{title}</p>
      {children}
    </div>
  );
}

export function FormTabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="form-tabs" role="tablist">
      {tabs.map((tab) => {
        const active = value === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`form-tab-${tab.id}`}
            aria-selected={active}
            aria-controls={`form-panel-${tab.id}`}
            className={`form-tab${active ? " is-active" : ""}`}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
