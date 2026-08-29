import monarcaLogo from "@/imports/Monarca.png";
import { useAuth } from "@/auth/AuthContext";
import { useI18n } from "@/i18n";
import type { SystemStatus } from "@/systemStatus";
import { APP_VERSION } from "@/version";
import { useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

const v = (name: string) => `var(${name})`;

function ModalOverlay({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg p-6 space-y-4 my-auto"
        style={{ background: v("--card"), border: `1px solid ${v("--border")}` }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

function IconSun() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function IconMoon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  );
}

function IconGlobe() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
    </svg>
  );
}

function IconEye({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function ThemeToggle({ light, onToggle, compact }: { light: boolean; onToggle: () => void; compact?: boolean }) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      onClick={onToggle}
      title={light ? t("theme.dark") : t("theme.light")}
      className="flex items-center justify-center w-9 h-9 rounded-md cursor-pointer transition-colors"
      style={{ background: v("--card"), border: `1px solid ${v("--border")}`, color: v("--text-sub") }}
    >
      {light ? <IconMoon /> : <IconSun />}
      {!compact && <span className="sr-only">{light ? t("theme.dark") : t("theme.light")}</span>}
    </button>
  );
}

export function LanguageSelector({ compact }: { compact?: boolean }) {
  const { locale, setLocale, localeShort, t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((x) => !x)}
        className="flex items-center gap-1.5 px-2.5 h-9 rounded-md cursor-pointer text-xs font-mono"
        style={{ background: v("--card"), border: `1px solid ${v("--border")}`, color: v("--text-sub") }}
        title={t("lang.label")}
      >
        <IconGlobe />
        <span>{localeShort}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 mt-1 z-30 min-w-[9rem] rounded-md py-1 shadow-lg"
            style={{ background: v("--card"), border: `1px solid ${v("--border")}` }}
          >
            {(["pt", "es"] as const).map((item) => (
              <button
                key={item}
                type="button"
                className="w-full text-left px-3 py-2 text-sm cursor-pointer hover:opacity-90"
                style={{ color: locale === item ? v("--gold") : v("--text-sub") }}
                onClick={() => {
                  setLocale(item);
                  setOpen(false);
                }}
              >
                {t(item === "pt" ? "lang.pt" : "lang.es")}
              </button>
            ))}
          </div>
        </>
      )}
      {!compact && null}
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggleShow,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggleShow: () => void;
}) {
  const { t } = useI18n();
  return (
    <label className="block">
      <span className="text-[13px] font-medium" style={{ color: v("--text-sub") }}>{label}</span>
      <div className="relative mt-1.5">
        <input
          className="field pr-11"
          type={show ? "text" : "password"}
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded cursor-pointer"
          style={{ color: v("--text-muted") }}
          onClick={onToggleShow}
          title={show ? t("login.hidePassword") : t("login.showPassword")}
          aria-label={show ? t("login.hidePassword") : t("login.showPassword")}
        >
          <IconEye open={show} />
        </button>
      </div>
    </label>
  );
}

export default function LoginPage({
  light,
  onToggleTheme,
  systemStatus,
}: {
  light: boolean;
  onToggleTheme: () => void;
  systemStatus: SystemStatus;
}) {
  const { login } = useAuth();
  const { t } = useI18n();
  const [loginValue, setLoginValue] = useState("");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setLoading(true);
    try {
      await login(loginValue.trim(), senha);
    } catch (err) {
      setErro(err instanceof Error ? err.message : t("login.error"));
    } finally {
      setLoading(false);
    }
  }

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

        <div className="flex flex-col items-center mb-8 pt-2">
          <img src={monarcaLogo} alt={t("app.name")} className="h-16 object-contain mb-4" />
          <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)", color: v("--text") }}>
            {t("login.title")}
          </h1>
        </div>

        <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
          {erro && (
            <div className="text-sm px-3 py-2 rounded-md" style={{ color: "#ef4444", background: "rgba(239,68,68,0.08)" }}>
              {erro}
            </div>
          )}
          <label className="block">
            <span className="text-[13px] font-medium" style={{ color: v("--text-sub") }}>{t("login.login")}</span>
            <input
              className="field mt-1.5"
              autoFocus
              autoComplete="username"
              value={loginValue}
              onChange={(e) => setLoginValue(e.target.value)}
              placeholder="system"
            />
          </label>
          <label className="block">
            <span className="text-[13px] font-medium" style={{ color: v("--text-sub") }}>{t("login.password")}</span>
            <div className="relative mt-1.5">
              <input
                className="field pr-11"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded cursor-pointer"
                style={{ color: v("--text-muted") }}
                onClick={() => setShowPassword((x) => !x)}
                title={showPassword ? t("login.hidePassword") : t("login.showPassword")}
                aria-label={showPassword ? t("login.hidePassword") : t("login.showPassword")}
              >
                <IconEye open={showPassword} />
              </button>
            </div>
          </label>
          <button type="submit" disabled={loading} className="btn-gold w-full py-2.5 text-sm mt-2">
            {loading ? t("system.checking") : t("login.submit")}
          </button>
        </form>

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

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return "?";
  if (partes.length === 1) return partes[0]!.slice(0, 2).toUpperCase();
  return `${partes[0]![0] ?? ""}${partes[partes.length - 1]![0] ?? ""}`.toUpperCase();
}

export function UserMenu() {
  const { user, logout, perfilLabel, alterarSenha, editarPerfil } = useAuth();
  const { t, locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState<"senha" | "perfil" | "idioma" | null>(null);
  const [nome, setNome] = useState("");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [senhaNova, setSenhaNova] = useState("");
  const [senhaConfirm, setSenhaConfirm] = useState("");
  const [showSenhaAtual, setShowSenhaAtual] = useState(false);
  const [showSenhaNova, setShowSenhaNova] = useState(false);
  const [showSenhaConfirm, setShowSenhaConfirm] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  if (!user) return null;

  function abrir(tipo: "senha" | "perfil" | "idioma") {
    setModal(tipo);
    setMsg(null);
    setErro(null);
    setNome(user!.nome);
    setSenhaAtual("");
    setSenhaNova("");
    setSenhaConfirm("");
    setShowSenhaAtual(false);
    setShowSenhaNova(false);
    setShowSenhaConfirm(false);
    setOpen(false);
  }

  async function salvarPerfil() {
    setSalvando(true);
    setErro(null);
    try {
      await editarPerfil(nome, user!.idioma);
      setMsg(t("profile.success"));
      setModal(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro");
    } finally {
      setSalvando(false);
    }
  }

  async function salvarIdioma(idioma: "pt" | "es") {
    setSalvando(true);
    setErro(null);
    try {
      await editarPerfil(user!.nome, idioma);
      setLocale(idioma);
      setMsg(t("profile.success"));
      setModal(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro");
    } finally {
      setSalvando(false);
    }
  }

  async function salvarSenha() {
    if (senhaNova !== senhaConfirm) {
      setErro(t("password.mismatch"));
      return;
    }
    setSalvando(true);
    setErro(null);
    try {
      await alterarSenha(senhaAtual, senhaNova);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro");
      setSalvando(false);
    }
  }

  return (
    <>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((x) => !x)}
          className="flex items-center justify-center w-9 h-9 rounded-full cursor-pointer shrink-0 text-xs font-semibold leading-none"
          style={{
            background: v("--gold-bg"),
            color: v("--gold"),
            border: `1px solid rgba(228,180,18,0.35)`,
          }}
          title={user.nome}
        >
          {iniciais(user.nome)}
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
            <div
              className="absolute right-0 mt-2 z-30 w-56 rounded-lg py-2 shadow-xl"
              style={{ background: v("--card"), border: `1px solid ${v("--border")}` }}
            >
              <div className="px-4 py-2 border-b" style={{ borderColor: v("--border") }}>
                <p className="text-sm font-medium truncate" style={{ color: v("--text") }}>{user.nome}</p>
                <p className="text-xs mt-0.5" style={{ color: v("--text-muted") }}>{perfilLabel(user.perfil)}</p>
              </div>
              <button type="button" className="menu-item" onClick={() => abrir("senha")}>{t("user.changePassword")}</button>
              <button type="button" className="menu-item" onClick={() => abrir("perfil")}>{t("user.editProfile")}</button>
              <button type="button" className="menu-item" onClick={() => abrir("idioma")}>{t("user.defaultLanguage")}</button>
              <div className="my-1" style={{ height: 1, background: v("--border") }} />
              <button
                type="button"
                className="menu-item"
                style={{ color: "#ef4444" }}
                onClick={() => void logout()}
              >
                {t("user.logout")}
              </button>
            </div>
          </>
        )}
      </div>

      {modal && (
        <ModalOverlay onClose={() => setModal(null)}>
            <h2 className="text-lg font-semibold" style={{ color: v("--text") }}>
              {modal === "senha" ? t("user.changePassword") : modal === "perfil" ? t("user.editProfile") : t("user.defaultLanguage")}
            </h2>
            {erro && <p className="text-sm" style={{ color: "#ef4444" }}>{erro}</p>}
            {msg && <p className="text-sm" style={{ color: "#22c55e" }}>{msg}</p>}

            {modal === "perfil" && (
              <label className="block">
                <span className="text-[13px] font-medium" style={{ color: v("--text-sub") }}>{t("common.name")}</span>
                <input className="field mt-1.5" value={nome} onChange={(e) => setNome(e.target.value)} />
              </label>
            )}

            {modal === "idioma" && (
              <div className="flex gap-2">
                {(["pt", "es"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    className="btn-ghost flex-1 py-2 text-sm"
                    style={{ borderColor: user.idioma === item ? v("--gold") : undefined, color: user.idioma === item ? v("--gold") : undefined }}
                    onClick={() => void salvarIdioma(item)}
                    disabled={salvando}
                  >
                    {t(item === "pt" ? "lang.pt" : "lang.es")}
                  </button>
                ))}
              </div>
            )}

            {modal === "senha" && (
              <>
                <PasswordField
                  label={t("password.current")}
                  value={senhaAtual}
                  onChange={setSenhaAtual}
                  show={showSenhaAtual}
                  onToggleShow={() => setShowSenhaAtual((x) => !x)}
                />
                <PasswordField
                  label={t("password.new")}
                  value={senhaNova}
                  onChange={setSenhaNova}
                  show={showSenhaNova}
                  onToggleShow={() => setShowSenhaNova((x) => !x)}
                />
                <PasswordField
                  label={t("password.confirm")}
                  value={senhaConfirm}
                  onChange={setSenhaConfirm}
                  show={showSenhaConfirm}
                  onToggleShow={() => setShowSenhaConfirm((x) => !x)}
                />
              </>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-ghost px-4 py-2 text-sm" onClick={() => setModal(null)}>{t("common.cancel")}</button>
              {modal !== "idioma" && (
                <button
                  type="button"
                  className="btn-gold px-4 py-2 text-sm"
                  disabled={salvando}
                  onClick={() => void (modal === "senha" ? salvarSenha() : salvarPerfil())}
                >
                  {salvando ? t("common.saving") : t("common.save")}
                </button>
              )}
            </div>
        </ModalOverlay>
      )}
    </>
  );
}
