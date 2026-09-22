import { Field } from "@/components/crud/Field";
import F2InsideHint from "@/components/F2InsideHint";
import SearchPickerModal, { type SearchPickerItem } from "@/components/SearchPickerModal";
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
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selecionada = value === "" ? undefined : cidades.find((c) => c.id === value);
  const opcoes = useMemo(() => filtrarCidades(cidades, busca).slice(0, MAX_OPCOES), [cidades, busca]);

  const items: SearchPickerItem[] = useMemo(() => {
    const lista: SearchPickerItem[] = [
      {
        id: "",
        label: t("papel.noCity"),
        selected: value === "",
      },
      ...opcoes.map((c) => ({
        id: String(c.id),
        label: rotuloCidade(c),
        selected: value === c.id,
      })),
    ];
    return lista;
  }, [opcoes, value, t]);

  function abrir() {
    setBusca("");
    setAberto(true);
  }

  function fechar() {
    setAberto(false);
    setBusca("");
    triggerRef.current?.focus();
  }

  function selecionar(id: string) {
    onChange(id === "" ? "" : Number(id));
    fechar();
  }

  const rotuloAtual = selecionada ? rotuloCidade(selecionada) : t("cidade.searchPlaceholder");

  return (
    <Field label={label ?? t("papel.city")} required={required}>
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
        aria-label={`${label ?? t("papel.city")} — ${t("common.f2Search")}`}
      >
        <span className="truncate text-sm min-w-0" style={{ color: selecionada ? v("--text") : v("--text-muted") }}>
          {rotuloAtual}
        </span>
        <F2InsideHint />
      </button>

      <SearchPickerModal
        open={aberto}
        title={t("cidade.searchModalTitle")}
        searchPlaceholder={t("cidade.searchInputPlaceholder")}
        query={busca}
        onQueryChange={setBusca}
        items={items}
        onPick={selecionar}
        onClose={fechar}
      />
    </Field>
  );
}
