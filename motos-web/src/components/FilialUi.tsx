import monarcaLogo from "@/imports/Monarca.png";
import { useAuth } from "@/auth/AuthContext";
import { useFilial } from "@/auth/FilialContext";
import { LanguageSelector, ThemeToggle } from "@/components/AuthUi";
import { useI18n } from "@/i18n";
import type { SystemStatus } from "@/systemStatus";
import { APP_VERSION } from "@/version";
import { useState, type ReactNode } from "react";

const v = (name: string) => `var(${name})`;

function IconBuilding() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01" />
    </svg>
  );
}

function IconChevron() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function AuthChrome({
  light,
  onToggleTheme,
  systemStatus,
  title,
  hint,
  children,
}: {
  light: boolean;
  onToggleTheme: () => void;
  systemStatus: SystemStatus;
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  const { t } = useI18n();
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: v("--bg") }}>
      <div
        className="relative w-full max-w-md rounded-xl p-8 shadow-xl"
        style={{ background: v("--card"), border: `1px solid ${v("--border")}` }}
      >
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <ThemeToggle light={light} onToggle={onToggleTheme} compact />
          <LanguageSelector compact />
        </div>
        <div className="flex flex-col items-center mb-6 pt-2">
          <img src={monarcaLogo} alt={t("app.name")} className="h-16 object-contain mb-4" />
          <h1 className="text-xl font-semibold text-center" style={{ fontFamily: "var(--font-display)", color: v("--text") }}>
            {title}
          </h1>
          {hint && (
            <p className="text-sm mt-2 text-center" style={{ color: v("--text-muted") }}>{hint}</p>
          )}
        </div>
        {children}
        <div className="mt-6 pt-4 flex flex-col items-center gap-1.5" style={{ borderTop: `1px solid ${v("--border")}` }}>
          <div className="flex items-center gap-1.5">
            <div
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{
                background: systemStatus === "online" ? "#34d399" : systemStatus === "offline" ? "#ef4444" : v("--text-muted"),
              }}
            />
            <span className="text-xs" style={{ color: v("--text-muted") }}>
              {systemStatus === "online"
                ? t("system.online")
                : systemStatus === "offline"
                  ? t("system.offline")
                  : t("system.checking")}
            </span>
          </div>
          <p className="text-[10px] font-mono" style={{ color: v("--text-muted") }}>
            {t("app.name")} · v{APP_VERSION}
          </p>
        </div>
      </div>
    </div>
  );
}

export function FilialGate({
  light,
  onToggleTheme,
  systemStatus,
  children,
}: {
  light: boolean;
  onToggleTheme: () => void;
  systemStatus: SystemStatus;
  children: ReactNode;
}) {
  const { t } = useI18n();
  const { logout } = useAuth();
  const { semAcesso, precisaEscolher, filiais, escolher, filial } = useFilial();

  if (semAcesso) {
    return (
      <AuthChrome
        light={light}
        onToggleTheme={onToggleTheme}
        systemStatus={systemStatus}
        title={t("filial.noAccess")}
        hint={t("filial.noAccessHint")}
      >
        <button type="button" className="btn-ghost w-full py-2.5 text-sm" onClick={() => void logout()}>
          {t("user.logout")}
        </button>
      </AuthChrome>
    );
  }

  if (precisaEscolher || !filial) {
    return (
      <AuthChrome
        light={light}
        onToggleTheme={onToggleTheme}
        systemStatus={systemStatus}
        title={t("filial.selectTitle")}
        hint={t("filial.selectHint")}
      >
        <div className="space-y-2">
          {filiais.map((item) => (
            <button
              key={item.id}
              type="button"
              className="w-full text-left px-4 py-3 rounded-md cursor-pointer transition-colors"
              style={{
                background: v("--card2"),
                border: `1px solid ${v("--border")}`,
                color: v("--text"),
              }}
              onClick={() => escolher(item.id)}
            >
              <span className="block text-sm font-medium">{item.nome}</span>
              {item.principal && (
                <span className="block text-[11px] mt-0.5" style={{ color: v("--gold") }}>
                  {t("empresa.principal")}
                </span>
              )}
            </button>
          ))}
        </div>
        <button type="button" className="btn-ghost w-full py-2 text-sm mt-4" onClick={() => void logout()}>
          {t("user.logout")}
        </button>
      </AuthChrome>
    );
  }

  return children;
}

export function FilialSwitcher() {
  const { t } = useI18n();
  const { filial, filiais, escolher } = useFilial();
  const [open, setOpen] = useState(false);

  if (!filial) return null;

  const podeTrocar = filiais.length > 1;

  return (
    <div className="relative">
      <button
        type="button"
        disabled={!podeTrocar}
        onClick={() => {
          if (podeTrocar) setOpen((x) => !x);
        }}
        className="flex items-center gap-1.5 px-2.5 h-9 rounded-md text-xs max-w-[12.5rem]"
        style={{
          background: v("--card"),
          border: `1px solid ${v("--border")}`,
          color: v("--text-sub"),
          cursor: podeTrocar ? "pointer" : "default",
        }}
        title={podeTrocar ? t("filial.switch") : filial.nome}
        aria-label={t("filial.current")}
      >
        <span className="shrink-0" style={{ color: v("--gold") }}><IconBuilding /></span>
        <span className="truncate">{filial.nome}</span>
        {podeTrocar && <span className="shrink-0 opacity-70"><IconChevron /></span>}
      </button>
      {open && podeTrocar && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 mt-1 z-30 min-w-[12rem] rounded-md py-1 shadow-lg"
            style={{ background: v("--card"), border: `1px solid ${v("--border")}` }}
          >
            {filiais.map((item) => (
              <button
                key={item.id}
                type="button"
                className="w-full text-left px-3 py-2 text-sm cursor-pointer hover:opacity-90"
                style={{ color: item.id === filial.id ? v("--gold") : v("--text-sub") }}
                onClick={() => {
                  escolher(item.id);
                  setOpen(false);
                }}
              >
                <span className="block truncate">{item.nome}</span>
                {item.principal && (
                  <span className="block text-[10px] mt-0.5" style={{ color: v("--text-muted") }}>
                    {t("empresa.principal")}
                  </span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
