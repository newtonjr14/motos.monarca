import { Field } from "@/components/crud/Field";
import type { Cidade } from "@/api";
import { rotuloCidade } from "@/format";
import { useI18n } from "@/i18n";
import { useMemo, useRef, useState } from "react";

const v = (name: string) => `var(${name})`;
const MAX_OPCOES = 80;

function filtrarCidades(cidades: Cidade[], query: string): Cidade[] {
  const q = query.trim().toLowerCase();
  if (!q) return cidades;
  return cidades.filter((c) => {
    const texto = `${c.nome} ${c.municipioNome ?? ""} ${c.divisaoSigla ?? ""} ${c.divisaoNome ?? ""} ${c.paisNome ?? ""}`.toLowerCase();
    return texto.includes(q);
  });
}

export default function CidadeSearchSelect({
  cidades,
  value,
  onChange,
  label,
  required,
}: {
  cidades: Cidade[];
  value: number | "";
  onChange: (id: number | "") => void;
  label?: string;
  required?: boolean;
}) {
  const { t } = useI18n();
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selecionada = value === "" ? undefined : cidades.find((c) => c.id === value);
  const opcoes = useMemo(() => filtrarCidades(cidades, busca).slice(0, MAX_OPCOES), [cidades, busca]);

  function fechar() {
    setAberto(false);
    setBusca("");
    triggerRef.current?.focus();
  }

  function selecionar(id: number | "") {
    onChange(id);
    setAberto(false);
    setBusca("");
  }

  function selecionarPrimeiro() {
    if (opcoes.length > 0) {
      selecionar(opcoes[0]!.id);
    }
  }

  const rotuloAtual = selecionada ? rotuloCidade(selecionada) : t("cidade.searchPlaceholder");

  return (
    <Field label={label ?? t("papel.city")} required={required}>
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
          <span className="truncate text-sm" style={{ color: selecionada ? v("--text") : v("--text-muted") }}>
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
                  placeholder={t("cidade.searchInputPlaceholder")}
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
                <li>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm cursor-pointer hover:opacity-90"
                    style={{ color: value === "" ? v("--gold") : v("--text-muted") }}
                    onClick={() => selecionar("")}
                  >
                    {t("papel.noCity")}
                  </button>
                </li>
                {opcoes.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm cursor-pointer hover:opacity-90"
                      style={{ color: value === c.id ? v("--gold") : v("--text-sub") }}
                      onClick={() => selecionar(c.id)}
                    >
                      {rotuloCidade(c)}
                    </button>
                  </li>
                ))}
                {opcoes.length === 0 && (
                  <li className="px-3 py-2 text-sm" style={{ color: v("--text-muted") }}>
                    {t("common.noRecords")}
                  </li>
                )}
              </ul>
            </div>
          </>
        )}
      </div>
    </Field>
  );
}
