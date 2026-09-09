import { useState } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "@/i18n";
import { mensagemErroApi } from "@/i18n/apiMessages";
import { atualizarFilial, type Filial, type Moeda } from "@/api";

const v = (name: string) => `var(${name})`;

function IconSettings() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  );
}

function ParamCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-4 py-3 cursor-pointer" style={{ borderBottom: `1px solid ${v("--border")}` }}>
      <span className="text-sm leading-snug flex-1" style={{ color: v("--text-sub") }}>{label}</span>
      <input
        type="checkbox"
        className="mt-0.5 shrink-0"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}

function filialBody(filial: Filial, params: { listarClientes: boolean; listarFornecedores: boolean; listarProdutos: boolean; moedaOperacao: Filial["moedaOperacao"] }) {
  return {
    idEmpresa: filial.idEmpresa,
    nome: filial.nome,
    ddi: filial.ddi,
    telefone: filial.telefone,
    email: filial.email,
    tipoLogradouro: filial.tipoLogradouro,
    logradouro: filial.logradouro,
    numero: filial.numero,
    bairro: filial.bairro,
    cep: filial.cep,
    complemento: filial.complemento,
    idCidade: filial.idCidade,
    timbrado: filial.timbrado,
    timbradoVigenciaInicio: filial.timbradoVigenciaInicio,
    timbradoVigenciaFim: filial.timbradoVigenciaFim,
    estabelecimentoNumero: filial.estabelecimentoNumero,
    pontoExpedicao: filial.pontoExpedicao,
    perfilFiscal: filial.perfilFiscal,
    moedaOperacao: params.moedaOperacao,
    principal: filial.principal,
    listarApenasClientesFilial: params.listarClientes,
    listarApenasFornecedoresFilial: params.listarFornecedores,
    listarApenasProdutosFilial: params.listarProdutos,
    status: filial.status,
  };
}

export function FilialParametrosIconButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      className="btn-row-menu"
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      <IconSettings />
    </button>
  );
}

export default function FilialParametrosModal({
  filial,
  onClose,
  onSaved,
}: {
  filial: Filial;
  onClose: () => void;
  onSaved: (filial: Filial) => void;
}) {
  const { t } = useI18n();
  const [listarClientes, setListarClientes] = useState(filial.listarApenasClientesFilial);
  const [listarFornecedores, setListarFornecedores] = useState(filial.listarApenasFornecedoresFilial);
  const [listarProdutos, setListarProdutos] = useState(filial.listarApenasProdutosFilial);
  const [moedaOperacao, setMoedaOperacao] = useState<Moeda>(filial.moedaOperacao ?? "usd");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    setErro(null);
    setSalvando(true);
    try {
      const atualizada = await atualizarFilial(
        filial.id,
        filialBody(filial, { listarClientes, listarFornecedores, listarProdutos, moedaOperacao }),
      );
      onSaved(atualizada);
      onClose();
    } catch (e) {
      setErro(mensagemErroApi(e, t, "empresa.error.saveFailed"));
    } finally {
      setSalvando(false);
    }
  }

  return createPortal(
    <div
      className="ficha-modal-overlay fixed inset-0 z-[200] flex items-start justify-center p-4 sm:p-6 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="ficha-modal w-full max-w-lg rounded-xl shadow-2xl flex flex-col"
        style={{ background: v("--card"), border: `1px solid ${v("--border")}` }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="filial-parametros-title"
      >
        <div className="ficha-modal-header px-6 py-4 shrink-0" style={{ borderBottom: `1px solid ${v("--border")}` }}>
          <h2 id="filial-parametros-title" className="text-base font-semibold" style={{ fontFamily: "var(--font-display)", color: v("--text") }}>
            {t("empresa.branchParameters")}
          </h2>
          <p className="text-sm mt-1" style={{ color: v("--text-muted") }}>{filial.nome}</p>
        </div>

        <div className="ficha-modal-body px-6 py-4 space-y-4">
          {erro && <p className="text-sm" style={{ color: "#ef4444" }}>{erro}</p>}

          <section>
            <h3 className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: v("--text-muted") }}>
              {t("empresa.section.parametersMoeda")}
            </h3>
            <label className="block">
              <span className="text-sm" style={{ color: v("--text-sub") }}>{t("empresa.moedaOperacao")}</span>
              <select
                className="field mt-1.5"
                value={moedaOperacao}
                onChange={(e) => setMoedaOperacao(e.target.value as Moeda)}
              >
                <option value="usd">{t("produto.currency.usd")}</option>
                <option value="pyg">{t("produto.currency.pyg")}</option>
                <option value="brl">{t("produto.currency.brl")}</option>
              </select>
              <span className="block text-xs mt-1.5" style={{ color: v("--text-muted") }}>{t("empresa.moedaOperacao.hint")}</span>
            </label>
          </section>

          <section>
            <h3 className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: v("--text-muted") }}>
              {t("empresa.section.parametersListagem")}
            </h3>
            <ParamCheckbox
              label={t("empresa.listClientsBranchOnly")}
              checked={listarClientes}
              onChange={setListarClientes}
            />
            <ParamCheckbox
              label={t("empresa.listSuppliersBranchOnly")}
              checked={listarFornecedores}
              onChange={setListarFornecedores}
            />
            <ParamCheckbox
              label={t("empresa.listProductsBranchOnly")}
              checked={listarProdutos}
              onChange={setListarProdutos}
            />
          </section>
        </div>

        <div className="ficha-modal-actions px-6 py-3 shrink-0 flex justify-end gap-2" style={{ borderTop: `1px solid ${v("--border")}`, background: v("--card2") }}>
          <button type="button" className="btn-ghost px-4 py-2 text-sm" onClick={onClose}>{t("common.cancel")}</button>
          <button type="button" disabled={salvando} className="btn-gold px-5 py-2 text-sm" onClick={() => void salvar()}>
            {salvando ? t("common.saving") : t("common.save")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
