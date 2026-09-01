import { atualizarPapel, excluirPapel, type Cidade, type Papel } from "@/api";
import { obterFilialAtivaId } from "@/filialContext";
import { Section } from "@/components/crud/Field";
import { formatarDocumentoExibicao, formatarEndereco, formatarTelefoneExibicao } from "@/format";
import { useI18n } from "@/i18n";
import { pessoaParaAtualizacao } from "@/papelUtils";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

const v = (name: string) => `var(${name})`;
const border1 = () => `1px solid ${v("--border")}`;

function NavBtn({ label, disabled, onClick, children }: {
  label: string; disabled?: boolean; onClick: () => void; children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="shrink-0 w-8 h-8 flex items-center justify-center rounded-md cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
      style={{ color: v("--text-muted"), background: v("--card2"), border: border1() }}
    >
      {children}
    </button>
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
  nav,
  onClose,
  onEdit,
  onChanged,
}: {
  item: Papel;
  recurso: "clientes" | "fornecedores";
  singular: string;
  cidades: Cidade[];
  nav?: { index: number; total: number; onPrev: () => void; onNext: () => void };
  onClose: () => void;
  onEdit: () => void;
  onChanged: () => Promise<void>;
}) {
  const { t } = useI18n();
  const [loading, setLoading] = useState<"status" | "delete" | null>(null);
  const p = item.pessoa;
  const telefone = formatarTelefoneExibicao(p.ddi, p.telefone);
  const telDisplay = telefone === "—" ? null : telefone;
  const email = p.email?.trim() || null;
  const temContato = Boolean(telDisplay || email);
  const endereco = formatarEndereco(p, cidades);
  const docPrincipal = p.documentos[0];
  const outrosDocs = p.documentos.slice(1);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (nav && !loading) {
        if (e.key === "ArrowUp" && nav.index > 0) {
          e.preventDefault();
          nav.onPrev();
        }
        if (e.key === "ArrowDown" && nav.index < nav.total - 1) {
          e.preventDefault();
          nav.onNext();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, nav, loading]);

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
    if (!confirm(t("ficha.confirmDeleteBranch"))) return;
    setLoading("delete");
    try {
      const idFilial = await obterFilialAtivaId();
      await excluirPapel(recurso, item.id, idFilial);
      onClose();
      await onChanged();
    } finally {
      setLoading(null);
    }
  }

  return createPortal(
    <div
      className="ficha-modal-overlay fixed inset-0 z-[200] flex items-start justify-center p-4 sm:p-6 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ficha-title"
    >
      <div
        className="ficha-modal w-full max-w-2xl rounded-xl shadow-2xl flex flex-col"
        style={{ background: v("--card"), border: border1() }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="ficha-modal-header px-6 py-4 flex items-start justify-between gap-4 shrink-0" style={{ borderBottom: border1() }}>
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
          <div className="flex items-center gap-1 shrink-0">
            {nav && nav.total > 1 && (
              <>
                <NavBtn label={t("ficha.prev")} disabled={nav.index <= 0} onClick={nav.onPrev}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                </NavBtn>
                <span className="text-xs tabular-nums px-1 min-w-[3rem] text-center" style={{ color: v("--text-muted") }}>
                  {nav.index + 1} / {nav.total}
                </span>
                <NavBtn label={t("ficha.next")} disabled={nav.index >= nav.total - 1} onClick={nav.onNext}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                </NavBtn>
              </>
            )}
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
        </div>

        {/* Resumo */}
        <div
          className="px-6 py-3 shrink-0"
          style={{ background: v("--card2"), borderBottom: border1() }}
        >
          {docPrincipal ? (
            <>
              <p className="text-[11px] font-medium uppercase tracking-wide" style={{ color: v("--text-muted") }}>
                {docPrincipal.tipoNome} · {docPrincipal.paisNome}
              </p>
              <p className="text-sm font-mono mt-0.5" style={{ color: v("--text") }}>
                {formatarDocumentoExibicao(docPrincipal.tipoCodigo, docPrincipal.numero)}
              </p>
            </>
          ) : (
            <p className="text-sm italic" style={{ color: v("--text-muted") }}>{t("ficha.notInformed")}</p>
          )}
        </div>

        {/* Conteúdo */}
        <div className="ficha-modal-body px-6 py-5 space-y-5">
          <div className="grid gap-5 sm:grid-cols-2 sm:items-start">
            <Section title={t("papel.section.contact")}>
              {temContato ? (
                <div className="space-y-3">
                  {telDisplay && (
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium uppercase tracking-wide" style={{ color: v("--text-muted") }}>{t("ddi.phone")}</p>
                      <p className="text-sm mt-1 font-mono break-words" style={{ color: v("--text") }}>{telDisplay}</p>
                    </div>
                  )}
                  {email && (
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium uppercase tracking-wide" style={{ color: v("--text-muted") }}>{t("common.email")}</p>
                      <p className="text-sm mt-1 break-words" style={{ color: v("--text") }}>{email}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm italic" style={{ color: v("--text-muted") }}>{t("ficha.noContact")}</p>
              )}
            </Section>

            <Section title={t("papel.section.address")}>
              {endereco ? (
                <p className="text-sm leading-relaxed break-words" style={{ color: v("--text") }}>{endereco}</p>
              ) : (
                <p className="text-sm italic" style={{ color: v("--text-muted") }}>{t("ficha.noAddress")}</p>
              )}
            </Section>
          </div>

          {outrosDocs.length > 0 && (
            <Section title={t("ficha.moreDocuments")}>
              <div className="space-y-2">
                {outrosDocs.map((d) => (
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
          )}
        </div>

        {/* Ações — linha única: primário + secundários */}
        <div className="ficha-modal-actions px-6 py-3 shrink-0" style={{ borderTop: border1(), background: v("--card2") }}>
          <div className="flex flex-col sm:flex-row gap-2">
            <button type="button" className="btn-action-edit flex-1 py-2 text-sm order-1" onClick={onEdit}>
              {t("common.edit")}
            </button>
            <button
              type="button"
              className="btn-action-secondary flex-1 py-2 text-sm order-2"
              disabled={loading != null}
              onClick={() => void alternarStatus()}
            >
              {loading === "status" ? t("common.saving") : item.status === "ativo" ? t("ficha.inactivate") : t("ficha.activate")}
            </button>
            <button
              type="button"
              className="btn-action-danger flex-1 py-2 text-sm order-3"
              disabled={loading != null}
              onClick={() => void excluir()}
            >
              {loading === "delete" ? t("common.saving") : t("common.delete")}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
