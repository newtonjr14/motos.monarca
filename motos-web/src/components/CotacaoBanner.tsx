import { useAuth } from "@/auth/AuthContext";
import { hojeAsuncion } from "@/components/CotacoesPage";
import { useI18n } from "@/i18n";
import { mensagemErroApi } from "@/i18n/apiMessages";
import {
  ApiError,
  avisarCotacaoMudou,
  buscarCotacaoHoje,
  criarCotacao,
  Permissao,
  type Cotacao,
} from "@/api";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const v = (name: string) => `var(${name})`;

type CotacaoHojeState = {
  cotacao: Cotacao | null;
  ausente: boolean;
  recarregar: () => void;
};

const CotacaoHojeContext = createContext<CotacaoHojeState | null>(null);

export function CotacaoHojeProvider({ children }: { children: ReactNode }) {
  const [cotacao, setCotacao] = useState<Cotacao | null>(null);
  const [ausente, setAusente] = useState(false);

  const recarregar = useCallback(() => {
    void buscarCotacaoHoje()
      .then((hoje) => {
        setCotacao(hoje);
        setAusente(false);
      })
      .catch((e) => {
        setCotacao(null);
        setAusente(e instanceof ApiError && e.status === 404);
      });
  }, []);

  useEffect(() => {
    recarregar();
    function onMudou() { recarregar(); }
    window.addEventListener("monarca:cotacao-mudou", onMudou);
    window.addEventListener("monarca:cotacao-ausente", onMudou);
    return () => {
      window.removeEventListener("monarca:cotacao-mudou", onMudou);
      window.removeEventListener("monarca:cotacao-ausente", onMudou);
    };
  }, [recarregar]);

  const value = useMemo(() => ({ cotacao, ausente, recarregar }), [cotacao, ausente, recarregar]);
  return <CotacaoHojeContext.Provider value={value}>{children}</CotacaoHojeContext.Provider>;
}

function useCotacaoHoje() {
  const ctx = useContext(CotacaoHojeContext);
  if (!ctx) throw new Error("CotacaoHojeProvider");
  return ctx;
}

export function CotacaoChip() {
  const { t } = useI18n();
  const { cotacao } = useCotacaoHoje();
  if (!cotacao) return null;
  return (
    <span
      className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-mono px-2 py-1 rounded-md whitespace-nowrap"
      title={t("cotacao.banner.rates")}
      style={{ color: v("--gold"), background: v("--gold-bg"), border: `1px solid ${v("--gold-border")}` }}
    >
      USD {cotacao.usdPyg} · BRL {cotacao.brlPyg}
    </span>
  );
}

export function CotacaoAlerta({ onOpenCadastro }: { onOpenCadastro: () => void }) {
  const { t } = useI18n();
  const { hasPermission } = useAuth();
  const { ausente, recarregar } = useCotacaoHoje();
  const podeGerenciar = hasPermission(Permissao.COTACAO_GERENCIAR);
  const [usdPyg, setUsdPyg] = useState("");
  const [brlPyg, setBrlPyg] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  if (!ausente) return null;

  async function salvar() {
    setErro(null);
    const usd = Number(usdPyg.replace(",", "."));
    const brl = Number(brlPyg.replace(",", "."));
    if (!Number.isFinite(usd) || usd <= 0 || !Number.isFinite(brl) || brl <= 0) {
      setErro(t("cotacao.error.rate"));
      return;
    }
    setSalvando(true);
    try {
      await criarCotacao({ data: hojeAsuncion(), usdPyg: usd, brlPyg: brl });
      avisarCotacaoMudou();
      recarregar();
      setUsdPyg("");
      setBrlPyg("");
    } catch (e) {
      setErro(mensagemErroApi(e, t, "common.error.saveFailed"));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div
      role="status"
      className="px-8 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-2"
      style={{ background: v("--gold-bg"), borderBottom: `1px solid ${v("--gold-border")}` }}
    >
      <p className="text-sm min-w-[16rem] flex-1" style={{ color: v("--text") }}>
        {podeGerenciar ? t("cotacao.banner.missing") : t("cotacao.banner.wait")}
      </p>
      {erro && <p className="text-xs" style={{ color: "#ef4444" }}>{erro}</p>}
      {podeGerenciar && (
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => { e.preventDefault(); void salvar(); }}
        >
          <label className="text-[11px] flex items-center gap-1.5" style={{ color: v("--text-muted") }}>
            {t("cotacao.usdPyg")}
            <input
              className="field font-mono w-[7.5rem] py-1.5"
              inputMode="decimal"
              autoComplete="off"
              value={usdPyg}
              onChange={(e) => setUsdPyg(e.target.value)}
              aria-label={t("cotacao.usdPyg")}
            />
          </label>
          <label className="text-[11px] flex items-center gap-1.5" style={{ color: v("--text-muted") }}>
            {t("cotacao.brlPyg")}
            <input
              className="field font-mono w-[7.5rem] py-1.5"
              inputMode="decimal"
              autoComplete="off"
              value={brlPyg}
              onChange={(e) => setBrlPyg(e.target.value)}
              aria-label={t("cotacao.brlPyg")}
            />
          </label>
          <button type="submit" disabled={salvando} className="btn-gold px-3 py-1.5 text-xs">
            {salvando ? t("common.saving") : t("cotacao.banner.save")}
          </button>
          <button type="button" className="btn-ghost px-3 py-1.5 text-xs" onClick={onOpenCadastro}>
            {t("nav.cotacoes")}
          </button>
        </form>
      )}
    </div>
  );
}
