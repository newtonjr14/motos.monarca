import { buscarPessoa, listarPapeis, type Cidade, type Pessoa } from "@/api";
import { useFilial } from "@/auth/FilialContext";
import { Section } from "@/components/crud/Field";
import { formatarDocumentoExibicao, formatarEndereco, formatarTelefoneExibicao, resolverTipoLogradouroCodigo } from "@/format";
import { mensagemErroApi } from "@/i18n/apiMessages";
import { useI18n } from "@/i18n";
import type { TranslationKey } from "@/i18n";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const v = (name: string) => `var(${name})`;
const border1 = () => `1px solid ${v("--border")}`;

export default function PessoaPreviewModal({
  idPessoa,
  cidades,
  recurso,
  onClose,
  onVincular,
}: {
  idPessoa: number;
  cidades: Cidade[];
  recurso?: "clientes" | "fornecedores";
  onClose: () => void;
  /** Quando o cadastro existe sem vínculo na filial atual */
  onVincular?: () => void;
}) {
  const { t } = useI18n();
  const { filial } = useFilial();
  const [pessoa, setPessoa] = useState<Pessoa | null>(null);
  const [jaCliente, setJaCliente] = useState(false);
  const [jaFornecedor, setJaFornecedor] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErro(null);
    setPessoa(null);
    setJaCliente(false);
    setJaFornecedor(false);
    void (async () => {
      try {
        const p = await buscarPessoa(idPessoa);
        if (cancelled) return;
        setPessoa(p);
        setLoading(false);
        const idFilial = filial?.id;
        void Promise.all([
          listarPapeis("clientes", idFilial),
          listarPapeis("fornecedores", idFilial),
        ]).then(([clientes, fornecedores]) => {
          if (cancelled) return;
          setJaCliente(clientes.some((c) => c.idPessoa === idPessoa));
          setJaFornecedor(fornecedores.some((f) => f.idPessoa === idPessoa));
        }).catch(() => {});
      } catch (e) {
        if (cancelled) return;
        setErro(mensagemErroApi(e, t, "papel.loadExistingFailed"));
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [idPessoa, t, filial?.id]);

  const docPrincipal = pessoa?.documentos[0];
  const telefone = pessoa ? formatarTelefoneExibicao(pessoa.ddi, pessoa.telefone) : "—";
  const telDisplay = telefone === "—" ? null : telefone;
  const telefone2 = pessoa ? formatarTelefoneExibicao(pessoa.ddi2, pessoa.telefone2) : "—";
  const tel2Display = telefone2 === "—" ? null : telefone2;
  const email = pessoa?.email?.trim() || null;
  const temContato = Boolean(telDisplay || tel2Display || email);
  const endereco = pessoa
    ? formatarEndereco(pessoa, cidades, (codigo) => {
        const n = resolverTipoLogradouroCodigo(codigo);
        return n ? t(`streetType.${n}` as TranslationKey) : codigo;
      })
    : null;

  const jaNoRecurso =
    recurso === "fornecedores" ? jaFornecedor : recurso === "clientes" ? jaCliente : jaCliente || jaFornecedor;
  const mostrarVincular = Boolean(onVincular) && !loading && !erro && pessoa != null && !jaNoRecurso;

  return createPortal(
    <div
      className="ficha-modal-overlay fixed inset-0 z-[210] flex items-start justify-center p-4 sm:p-6 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pessoa-preview-title"
    >
      <div
        className="ficha-modal ficha-modal-compact w-full max-w-2xl rounded-xl shadow-2xl flex flex-col"
        style={{ background: v("--card"), border: border1() }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 flex items-start justify-between gap-4 shrink-0" style={{ borderBottom: border1() }}>
          <div className="min-w-0 space-y-2">
            <p id="pessoa-preview-title" className="text-sm font-medium uppercase tracking-wide" style={{ color: v("--gold") }}>
              {t("papel.existingPreviewTitle")}
            </p>
            {pessoa && (
              <>
                <p className="text-lg font-semibold leading-snug truncate" style={{ fontFamily: "var(--font-display)", color: v("--text") }}>
                  {pessoa.nomeRazaoSocial}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs" style={{ color: v("--text-sub") }}>
                    {pessoa.tipoPessoa === "fisica" ? t("tipoPessoa.fisica") : t("tipoPessoa.juridica")}
                  </span>
                  {jaCliente && (
                    <span className="text-[11px] px-2 py-0.5 rounded border" style={{ color: v("--gold"), borderColor: v("--gold-border"), background: v("--gold-bg") }}>
                      {t("papel.alreadyCliente")}
                    </span>
                  )}
                  {jaFornecedor && (
                    <span className="text-[11px] px-2 py-0.5 rounded border" style={{ color: v("--gold"), borderColor: v("--gold-border"), background: v("--gold-bg") }}>
                      {t("papel.alreadyFornecedor")}
                    </span>
                  )}
                </div>
              </>
            )}
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

        {loading && (
          <div className="px-6 py-10 text-center text-sm" style={{ color: v("--text-muted") }}>{t("common.loading")}</div>
        )}

        {erro && !loading && (
          <div className="px-6 py-8 text-center text-sm" style={{ color: "#ef4444" }}>{erro}</div>
        )}

        {pessoa && !loading && !erro && (
          <>
            {docPrincipal && (
              <div className="px-6 py-3 shrink-0" style={{ background: v("--card2"), borderBottom: border1() }}>
                <p className="text-[11px] font-medium uppercase tracking-wide" style={{ color: v("--text-muted") }}>
                  {docPrincipal.tipoNome} · {docPrincipal.paisNome}
                </p>
                <p className="text-sm font-mono mt-0.5" style={{ color: v("--text") }}>
                  {formatarDocumentoExibicao(docPrincipal.tipoCodigo, docPrincipal.numero)}
                </p>
              </div>
            )}

            <div className="ficha-modal-body px-6 py-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 sm:items-start">
                <Section title={t("papel.section.contact")}>
                  {temContato ? (
                    <div className="space-y-3">
                      {telDisplay && (
                        <div className="min-w-0">
                          <p className="text-[11px] font-medium uppercase tracking-wide" style={{ color: v("--text-muted") }}>{t("ddi.phone")}</p>
                          <p className="text-sm mt-1 font-mono break-words" style={{ color: v("--text") }}>{telDisplay}</p>
                        </div>
                      )}
                      {tel2Display && (
                        <div className="min-w-0">
                          <p className="text-[11px] font-medium uppercase tracking-wide" style={{ color: v("--text-muted") }}>{t("ddi.phone2")}</p>
                          <p className="text-sm mt-1 font-mono break-words" style={{ color: v("--text") }}>{tel2Display}</p>
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

              {pessoa.documentos.length > 1 && (
                <Section title={t("ficha.moreDocuments")}>
                  <div className="space-y-2">
                    {pessoa.documentos.slice(1).map((d) => (
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

            {mostrarVincular && (
              <div className="px-6 py-4 flex flex-wrap gap-2 justify-end shrink-0" style={{ borderTop: border1() }}>
                <p className="w-full text-xs mb-1" style={{ color: v("--text-muted") }}>
                  {t("error.conflict.docUnlinkedPreview")}
                </p>
                <button type="button" className="btn-ghost text-sm px-3 py-1.5" onClick={onClose}>
                  {t("ficha.close")}
                </button>
                <button type="button" className="btn-gold text-sm px-3 py-1.5" onClick={onVincular}>
                  {t("papel.linkToBranch")}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
