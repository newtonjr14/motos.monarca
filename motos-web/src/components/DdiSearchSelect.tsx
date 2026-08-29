import { Field } from "@/components/crud/Field";
import {
  PAISES_TELEFONE,
  apenasDigitos,
  formatarTelefoneLocal,
  paisPorCodigo,
  type PaisTelefone,
} from "@/format";
import { countryTranslationKey, useI18n } from "@/i18n";
import { useMemo, useRef, useState } from "react";

const v = (name: string) => `var(${name})`;

function normalizarBusca(query: string): string {
  return query.trim().toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
}

function filtrarPaises(
  query: string,
  nomePais: (iso: string, fallback: string) => string,
): PaisTelefone[] {
  const q = normalizarBusca(query);
  if (!q) return PAISES_TELEFONE;

  const qDigits = query.replace(/\D/g, "");
  const qComMais = query.trim().replace(/\s/g, "");

  return PAISES_TELEFONE.filter((p) => {
    const nomeTrad = normalizarBusca(nomePais(p.iso, p.nome));
    const nomeOriginal = normalizarBusca(p.nome);
    const iso = p.iso.toLowerCase();

    const matchNome = nomeTrad.includes(q) || nomeOriginal.includes(q);
    const matchIso = iso.includes(q);
    const matchCodigo =
      qDigits.length > 0 &&
      (p.codigo.startsWith(qDigits) ||
        p.codigo.includes(qDigits) ||
        (qComMais.startsWith("+") && `+${p.codigo}`.startsWith(qComMais)));

    return matchNome || matchIso || matchCodigo;
  });
}

export default function DdiSearchSelect({
  ddi,
  telefone,
  onChange,
}: {
  ddi: string;
  telefone: string;
  onChange: (next: { ddi: string; telefone: string }) => void;
}) {
  const { t } = useI18n();
  const nomePais = (iso: string, fallback: string) => {
    const key = countryTranslationKey(iso);
    const trad = t(key);
    return trad === key ? fallback : trad;
  };

  const conhecido = paisPorCodigo(ddi);
  const [modoOutro, setModoOutro] = useState(() => Boolean(ddi) && !paisPorCodigo(ddi));
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const pais = modoOutro ? undefined : conhecido;
  const digits = apenasDigitos(telefone);
  const visivel = pais ? formatarTelefoneLocal(digits, pais.mask) : telefone;

  const opcoes = useMemo(() => filtrarPaises(busca, nomePais), [busca, t]);

  function fechar() {
    setAberto(false);
    setBusca("");
    triggerRef.current?.focus();
  }

  function selecionar(val: string) {
    if (val === "outro") {
      setModoOutro(true);
      onChange({ ddi: conhecido ? "" : ddi, telefone: "" });
    } else if (val === "") {
      setModoOutro(false);
      onChange({ ddi: "", telefone: "" });
    } else {
      setModoOutro(false);
      onChange({ ddi: val, telefone: "" });
    }
    setAberto(false);
    setBusca("");
  }

  function selecionarPrimeiro() {
    if (opcoes.length > 0) {
      selecionar(opcoes[0]!.codigo);
    }
  }

  const rotuloAtual = modoOutro
    ? ddi
      ? `+${ddi} (${t("ddi.other").toLowerCase()})`
      : t("ddi.otherManual")
    : conhecido
      ? `+${conhecido.codigo} ${nomePais(conhecido.iso, conhecido.nome)}`
      : t("ddi.searchPlaceholder");

  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: "minmax(11rem, 0.9fr) 1.1fr" }}>
      <Field label={t("ddi.label")}>
        <div className="relative" ref={containerRef}>
          <button
            ref={triggerRef}
            type="button"
            className="field text-left flex items-center justify-between gap-2 cursor-pointer"
            onClick={() => setAberto((x) => !x)}
            onKeyDown={(e) => {
              if (e.key === "F2") {
                e.preventDefault();
                setAberto(true);
              }
            }}
          >
            <span className="truncate text-sm" style={{ color: ddi || modoOutro ? v("--text") : v("--text-muted") }}>
              {rotuloAtual}
            </span>
            <span className="text-xs shrink-0" style={{ color: v("--text-muted") }}>▾</span>
          </button>
          {aberto && (
            <>
              <div className="fixed inset-0 z-20" onClick={fechar} />
              <div
                className="absolute left-0 right-0 mt-1 z-30 rounded-md shadow-lg overflow-hidden"
                style={{ background: v("--card"), border: `1px solid ${v("--border")}` }}
              >
                <div className="p-2" style={{ borderBottom: `1px solid ${v("--border")}` }}>
                  <input
                    className="field text-sm"
                    autoFocus
                    placeholder={t("ddi.searchInputPlaceholder")}
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        selecionarPrimeiro();
                      } else if (e.key === "Escape") {
                        e.preventDefault();
                        fechar();
                      }
                    }}
                  />
                </div>
                <ul className="max-h-48 overflow-y-auto py-1">
                  {!busca.trim() && (
                    <li>
                      <button
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm cursor-pointer hover:opacity-90"
                        style={{ color: v("--text-muted") }}
                        onClick={() => selecionar("")}
                      >
                        {t("ddi.noPhone")}
                      </button>
                    </li>
                  )}
                  {opcoes.map((p) => (
                    <li key={p.codigo}>
                      <button
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm cursor-pointer hover:opacity-90"
                        style={{ color: ddi === p.codigo && !modoOutro ? v("--gold") : v("--text-sub") }}
                        onClick={() => selecionar(p.codigo)}
                      >
                        <span className="font-mono">+{p.codigo}</span> {nomePais(p.iso, p.nome)}{" "}
                        <span className="text-xs" style={{ color: v("--text-muted") }}>({p.iso})</span>
                      </button>
                    </li>
                  ))}
                  {busca.trim() && opcoes.length === 0 && (
                    <li className="px-3 py-2 text-sm" style={{ color: v("--text-muted") }}>
                      {t("common.noRecords")}
                    </li>
                  )}
                  {!busca.trim() && (
                    <li>
                      <button
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm cursor-pointer hover:opacity-90"
                        style={{ color: modoOutro ? v("--gold") : v("--text-sub") }}
                        onClick={() => selecionar("outro")}
                      >
                        {t("ddi.other")}
                      </button>
                    </li>
                  )}
                </ul>
              </div>
            </>
          )}
        </div>
        {modoOutro && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm" style={{ color: v("--text-muted") }}>+</span>
            <input
              className="field font-mono"
              inputMode="numeric"
              value={ddi}
              onChange={(e) => onChange({ ddi: apenasDigitos(e.target.value).slice(0, 4), telefone: "" })}
              placeholder="DDI"
              onKeyDown={(e) => {
                if (e.key === "F2") {
                  e.preventDefault();
                  setAberto(true);
                }
              }}
            />
          </div>
        )}
      </Field>
      <Field label={t("ddi.phone")}>
        <input
          className="field font-mono"
          inputMode="numeric"
          value={visivel}
          placeholder={pais?.mask.replace(/#/g, "0") ?? t("ddi.phonePlaceholder")}
          onChange={(e) => {
            const max = pais?.maxDigits ?? 15;
            onChange({ ddi, telefone: apenasDigitos(e.target.value).slice(0, max) });
          }}
        />
      </Field>
    </div>
  );
}
