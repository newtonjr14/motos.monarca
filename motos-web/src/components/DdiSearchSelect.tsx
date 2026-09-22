import { Field } from "@/components/crud/Field";
import F2InsideHint from "@/components/F2InsideHint";
import SearchPickerModal, { type SearchPickerItem } from "@/components/SearchPickerModal";
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
  phoneLabel,
  fallbackDdi,
}: {
  ddi: string;
  telefone: string;
  onChange: (next: { ddi: string; telefone: string }) => void;
  phoneLabel?: string;
  /** Se o DDI desta linha estiver vazio, usa este para máscara (ex.: mesmo país do 1º telefone). */
  fallbackDdi?: string;
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
  const triggerRef = useRef<HTMLButtonElement>(null);

  const ddiMascara = (!modoOutro && (ddi || fallbackDdi)) || "";
  const pais = modoOutro ? undefined : paisPorCodigo(ddiMascara);
  const digits = apenasDigitos(telefone);
  const visivel = pais ? formatarTelefoneLocal(digits, pais.mask) : telefone;

  const opcoes = useMemo(() => filtrarPaises(busca, nomePais), [busca, t]);

  const items: SearchPickerItem[] = useMemo(() => {
    const lista: SearchPickerItem[] = [];
    if (!busca.trim()) {
      lista.push({
        id: "",
        label: t("ddi.noPhone"),
        selected: !ddi && !modoOutro,
      });
    }
    for (const p of opcoes) {
      lista.push({
        id: p.codigo,
        label: (
          <>
            <span className="font-mono">+{p.codigo}</span> {nomePais(p.iso, p.nome)}{" "}
            <span className="text-xs" style={{ color: v("--text-muted") }}>({p.iso})</span>
          </>
        ),
        selected: ddi === p.codigo && !modoOutro,
      });
    }
    if (!busca.trim()) {
      lista.push({
        id: "outro",
        label: t("ddi.other"),
        selected: modoOutro,
      });
    }
    return lista;
  }, [opcoes, busca, ddi, modoOutro, t]);

  function abrir() {
    setBusca("");
    setAberto(true);
  }

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
    fechar();
  }

  const rotuloAtual = modoOutro
    ? ddi
      ? `+${ddi} (${t("ddi.other").toLowerCase()})`
      : t("ddi.otherManual")
    : conhecido
      ? `+${conhecido.codigo} ${nomePais(conhecido.iso, conhecido.nome)}`
      : t("ddi.searchPlaceholder");

  return (
    <>
      <div className="grid gap-3" style={{ gridTemplateColumns: "minmax(9.75rem, 11rem) minmax(0, 1fr)" }}>
        <Field label={t("ddi.label")}>
          <button
            ref={triggerRef}
            type="button"
            className="field text-left flex items-center justify-between gap-2 cursor-pointer w-full"
            onClick={abrir}
            onKeyDown={(e) => {
              if (e.key === "F2") {
                e.preventDefault();
                abrir();
              }
            }}
            aria-label={`${t("ddi.label")} — ${t("common.f2Search")}`}
          >
            <span className="truncate text-sm min-w-0" style={{ color: ddi || modoOutro ? v("--text") : v("--text-muted") }}>
              {rotuloAtual}
            </span>
            <F2InsideHint />
          </button>
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
                    abrir();
                  }
                }}
              />
            </div>
          )}
        </Field>
        <Field label={phoneLabel ?? t("ddi.phone")}>
          <input
            className="field font-mono"
            inputMode="numeric"
            value={visivel}
            placeholder={pais?.mask.replace(/#/g, "0") ?? t("ddi.phonePlaceholder")}
            onChange={(e) => {
              const max = pais?.maxDigits ?? 15;
              const nextDdi = ddi || (!modoOutro && fallbackDdi && paisPorCodigo(fallbackDdi) ? fallbackDdi : ddi);
              onChange({ ddi: nextDdi, telefone: apenasDigitos(e.target.value).slice(0, max) });
            }}
          />
        </Field>
      </div>

      <SearchPickerModal
        open={aberto}
        title={t("ddi.searchModalTitle")}
        searchPlaceholder={t("ddi.searchInputPlaceholder")}
        query={busca}
        onQueryChange={setBusca}
        items={items}
        onPick={selecionar}
        onClose={fechar}
      />
    </>
  );
}
