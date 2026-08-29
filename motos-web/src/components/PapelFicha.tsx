import { atualizarPapel, excluirPapel, type Cidade, type Papel, type Pessoa } from "@/api";
import { Section } from "@/components/crud/Field";
import { formatarDocumentoExibicao, formatarTelefoneExibicao } from "@/format";
import { useI18n } from "@/i18n";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const v = (name: string) => `var(${name})`;
const border1 = () => `1px solid ${v("--border")}`;

function cidadeLabel(cidades: Cidade[], id: number | null) {
  if (id == null) return null;
  const c = cidades.find((x) => x.id === id);
  if (!c) return null;
  const divisao = c.divisaoSigla ?? c.divisaoNome;
  return `${c.nome} · ${divisao} · ${c.paisNome}`;
}

function pessoaParaAtualizacao(p: Pessoa) {
  return {
    nomeRazaoSocial: p.nomeRazaoSocial,
    tipoPessoa: p.tipoPessoa,
    ddi: p.ddi,
    telefone: p.telefone,
    email: p.email,
    tipoLogradouro: p.tipoLogradouro,
    logradouro: p.logradouro,
    numero: p.numero,
    bairro: p.bairro,
    cep: p.cep,
    complemento: p.complemento,
    idCidade: p.idCidade,
    status: "ativo" as const,
    documentos: p.documentos.map((d) => ({
      idPais: d.idPais,
      idTipoDocumento: d.idTipoDocumento,
      numero: d.numero,
    })),
  };
}

function FichaField({ label, value, mono }: { label: string; value: string | null | undefined; mono?: boolean }) {
  const { t } = useI18n();
  const vazio = !value?.trim();
  const display = vazio ? t("ficha.notInformed") : value!;
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-wide" style={{ color: v("--text-muted") }}>{label}</p>
      <p
        className={`text-sm mt-1 break-words${mono ? " font-mono" : ""}${vazio ? " italic" : ""}`}
        style={{ color: vazio ? v("--text-muted") : v("--text") }}
      >
        {display}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: "ativo" | "inativo" }) {
  const { t } = useI18n();
  const ativo = status === "ativo";
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border"
      style={{
        background: ativo ? "var(--success-bg)" : "var(--card2)",
        borderColor: ativo ? "var(--success-border)" : "var(--border)",
        color: ativo ? "var(--success)" : v("--text-muted"),
      }}
    >
      {ativo ? t("common.active") : t("common.inactive")}
    </span>
  );
}

export default function PapelFicha({
  item,
  recurso,
  singular,
  cidades,
  onClose,
  onEdit,
  onChanged,
}: {
  item: Papel;
  recurso: "clientes" | "fornecedores";
  singular: string;
  cidades: Cidade[];
  onClose: () => void;
  onEdit: () => void;
  onChanged: () => Promise<void>;
}) {
  const { t } = useI18n();
  const [loading, setLoading] = useState<"status" | "delete" | null>(null);
  const p = item.pessoa;
  const telefone = formatarTelefoneExibicao(p.ddi, p.telefone);
  const telDisplay = telefone === "—" ? null : telefone;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  async function alternarStatus() {
    const proximo = item.status === "ativo" ? "inativo" : "ativo";
    const msg = proximo === "inativo" ? t("ficha.confirmInactivate") : t("ficha.confirmActivate");
    if (!confirm(msg)) return;
    setLoading("status");
    try {
      await atualizarPapel(recurso, item.id, {
        status: proximo,
        pessoa: pessoaParaAtualizacao(p),
      });
      await onChanged();
    } finally {
      setLoading(null);
    }
  }

  async function excluir() {
    if (!confirm(t("ficha.confirmDelete"))) return;
    setLoading("delete");
    try {
      await excluirPapel(recurso, item.id);
      onClose();
      await onChanged();
    } finally {
      setLoading(null);
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ficha-title"
    >
      <div
        className="w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[min(90vh,720px)]"
        style={{ background: v("--card"), border: border1() }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="px-6 py-5 flex items-start justify-between gap-4 shrink-0" style={{ borderBottom: border1() }}>
          <div className="min-w-0 space-y-2">
            <p id="ficha-title" className="text-lg font-semibold leading-snug truncate" style={{ fontFamily: "var(--font-display)", color: v("--text") }}>
              {p.nomeRazaoSocial}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={item.status} />
              <span className="text-xs" style={{ color: v("--text-sub") }}>
                {p.tipoPessoa === "fisica" ? t("tipoPessoa.fisica") : t("tipoPessoa.juridica")} · {singular}
              </span>
            </div>
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

        {/* Conteúdo — grid 2 colunas, sem scroll na maioria dos casos */}
        <div className="px-6 py-5 overflow-y-auto flex-1 space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Section title={t("papel.section.contact")}>
              <div className="space-y-3">
                <FichaField label={t("ddi.phone")} value={telDisplay} mono />
                <FichaField label={t("common.email")} value={p.email} />
              </div>
            </Section>

            <Section title={t("papel.section.document")}>
              <div className="space-y-2">
                {p.documentos.map((d) => (
                  <div key={d.id} className="p-3 rounded-md" style={{ background: v("--card2"), border: border1() }}>
                    <p className="text-[11px] font-medium uppercase tracking-wide" style={{ color: v("--text-muted") }}>
                      {d.tipoNome} · {d.paisNome}
                    </p>
                    <p className="text-sm font-mono mt-1" style={{ color: v("--text") }}>
                      {formatarDocumentoExibicao(d.tipoCodigo, d.numero)}
                    </p>
                  </div>
                ))}
              </div>
            </Section>
          </div>

          <Section title={t("papel.section.address")}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <FichaField label={t("papel.streetType")} value={p.tipoLogradouro} />
              <FichaField label={t("papel.street")} value={p.logradouro} />
              <FichaField label={t("papel.number")} value={p.numero} />
              <FichaField label={t("papel.neighborhood")} value={p.bairro} />
              <FichaField label={t("papel.postalCode")} value={p.cep} mono />
              <FichaField label={t("papel.complement")} value={p.complemento} />
              <FichaField label={t("papel.city")} value={cidadeLabel(cidades, p.idCidade)} />
            </div>
          </Section>
        </div>

        {/* Ações */}
        <div className="px-6 py-4 shrink-0 flex flex-col sm:flex-row gap-2" style={{ borderTop: border1(), background: v("--card2") }}>
          <button type="button" className="btn-action-edit flex-1 py-2.5 text-sm" onClick={onEdit}>
            {t("common.edit")}
          </button>
          <button
            type="button"
            className="btn-action-secondary flex-1 py-2.5 text-sm"
            disabled={loading != null}
            onClick={() => void alternarStatus()}
          >
            {loading === "status" ? t("common.saving") : item.status === "ativo" ? t("ficha.inactivate") : t("ficha.activate")}
          </button>
          <button
            type="button"
            className="btn-action-danger flex-1 py-2.5 text-sm"
            disabled={loading != null}
            onClick={() => void excluir()}
          >
            {loading === "delete" ? t("common.saving") : t("common.delete")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
