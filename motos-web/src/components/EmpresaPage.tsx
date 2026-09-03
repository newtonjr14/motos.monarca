import { useCallback, useEffect, useState } from "react";
import CidadeSearchSelect from "@/components/CidadeSearchSelect";
import DdiSearchSelect from "@/components/DdiSearchSelect";
import FilialParametrosModal, { FilialParametrosIconButton } from "@/components/FilialParametrosModal";
import { useCrudReset } from "@/hooks/useCrudReset";
import { useI18n } from "@/i18n";
import { mensagemErroApi } from "@/i18n/apiMessages";
import {
  atualizarEmpresa,
  atualizarFilial,
  criarFilial,
  excluirFilial,
  listarEmpresas,
  listarFiliais,
  type Cidade,
  type Empresa,
  type Filial,
} from "@/api";
import { normalizarCep, toEmailLower, toTitleCase } from "@/format";

const v = (name: string) => `var(${name})`;

function Field({
  label,
  children,
  required,
  className,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="block text-xs mb-1" style={{ color: v("--text-muted") }}>
        {label}{required && " *"}
      </span>
      {children}
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium" style={{ color: v("--text-sub") }}>{title}</h2>
      {children}
    </section>
  );
}

function StatusBadge({ status }: { status: "ativo" | "inativo" }) {
  const { t } = useI18n();
  const active = status === "ativo";
  return (
    <span className="inline-flex px-2 py-0.5 rounded text-xs border"
      style={{
        background: active ? "var(--success-bg)" : "rgba(148,163,184,0.1)",
        borderColor: active ? "var(--success-border)" : "rgba(148,163,184,0.2)",
        color: active ? "var(--success)" : v("--text-muted"),
      }}>
      {active ? t("common.active") : t("common.inactive")}
    </span>
  );
}

export default function EmpresaPage({ cidades, navReset }: { cidades: Cidade[]; navReset: number }) {
  const { t } = useI18n();
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [filiais, setFiliais] = useState<Filial[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [salvandoEmpresa, setSalvandoEmpresa] = useState(false);
  const [filialForm, setFilialForm] = useState<"lista" | "form">("lista");
  const [editandoFilial, setEditandoFilial] = useState<Filial | null>(null);
  const [salvandoFilial, setSalvandoFilial] = useState(false);

  const [razaoSocial, setRazaoSocial] = useState("");
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [ruc, setRuc] = useState("");
  const [representanteNome, setRepresentanteNome] = useState("");
  const [representanteDocumento, setRepresentanteDocumento] = useState("");
  const [statusEmpresa, setStatusEmpresa] = useState<"ativo" | "inativo">("ativo");

  const [nomeFilial, setNomeFilial] = useState("");
  const [ddi, setDdi] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [tipoLogradouro, setTipoLogradouro] = useState("");
  const [logradouro, setLogradouro] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [cep, setCep] = useState("");
  const [complemento, setComplemento] = useState("");
  const [idCidade, setIdCidade] = useState<number | "">("");
  const [timbrado, setTimbrado] = useState("");
  const [timbradoInicio, setTimbradoInicio] = useState("");
  const [timbradoFim, setTimbradoFim] = useState("");
  const [estabelecimento, setEstabelecimento] = useState("");
  const [pontoExpedicao, setPontoExpedicao] = useState("");
  const [principal, setPrincipal] = useState(false);
  const [statusFilial, setStatusFilial] = useState<"ativo" | "inativo">("ativo");
  const [parametrosFilial, setParametrosFilial] = useState<Filial | null>(null);

  const resetLista = useCallback(() => {
    setFilialForm("lista");
    setEditandoFilial(null);
  }, []);
  useCrudReset(navReset, resetLista);

  function preencherEmpresa(e: Empresa) {
    setEmpresa(e);
    setRazaoSocial(e.razaoSocial);
    setNomeFantasia(e.nomeFantasia);
    setRuc(e.ruc);
    setRepresentanteNome(e.representanteNome ?? "");
    setRepresentanteDocumento(e.representanteDocumento ?? "");
    setStatusEmpresa(e.status === "inativo" ? "inativo" : "ativo");
  }

  async function carregar() {
    try {
      setErro(null);
      const empresas = await listarEmpresas();
      const atual = empresas[0] ?? null;
      if (atual) {
        preencherEmpresa(atual);
        setFiliais(await listarFiliais(atual.id));
      } else {
        setEmpresa(null);
        setFiliais([]);
      }
    } catch (e) {
      setErro(mensagemErroApi(e, t, "empresa.error.loadFailed"));
    }
  }

  useEffect(() => { void carregar(); }, []);

  async function salvarEmpresa() {
    if (!empresa) return;
    setErro(null);
    if (!razaoSocial.trim() || !nomeFantasia.trim() || !ruc.trim()) {
      setErro(t("empresa.error.required"));
      return;
    }
    setSalvandoEmpresa(true);
    try {
      const body = {
        razaoSocial: toTitleCase(razaoSocial),
        nomeFantasia: toTitleCase(nomeFantasia),
        ruc: ruc.trim(),
        representanteNome: representanteNome.trim() ? toTitleCase(representanteNome) : null,
        representanteDocumento: representanteDocumento.trim() || null,
        status: statusEmpresa,
      };
      preencherEmpresa(await atualizarEmpresa(empresa.id, body));
    } catch (e) {
      setErro(mensagemErroApi(e, t, "empresa.error.saveFailed"));
    } finally {
      setSalvandoEmpresa(false);
    }
  }

  function abrirFilial(item?: Filial) {
    setEditandoFilial(item ?? null);
    setNomeFilial(item?.nome ?? "");
    setDdi(item?.ddi ?? "");
    setTelefone(item?.telefone ?? "");
    setEmail(item?.email ?? "");
    setTipoLogradouro(item?.tipoLogradouro ?? "");
    setLogradouro(item?.logradouro ?? "");
    setNumero(item?.numero ?? "");
    setBairro(item?.bairro ?? "");
    setCep(item?.cep ?? "");
    setComplemento(item?.complemento ?? "");
    setIdCidade(item?.idCidade ?? "");
    setTimbrado(item?.timbrado ?? "");
    setTimbradoInicio(item?.timbradoVigenciaInicio ?? "");
    setTimbradoFim(item?.timbradoVigenciaFim ?? "");
    setEstabelecimento(item?.estabelecimentoNumero ?? "");
    setPontoExpedicao(item?.pontoExpedicao ?? "");
    setPrincipal(item?.principal ?? false);
    setStatusFilial(item?.status === "inativo" ? "inativo" : "ativo");
    setErro(null);
    setFilialForm("form");
  }

  async function salvarFilial() {
    if (!empresa) return;
    setErro(null);
    if (!nomeFilial.trim()) {
      setErro(t("empresa.error.required"));
      return;
    }
    setSalvandoFilial(true);
    try {
      const body = {
        idEmpresa: empresa.id,
        nome: toTitleCase(nomeFilial),
        ddi: ddi || null,
        telefone: telefone || null,
        email: email ? toEmailLower(email) : null,
        tipoLogradouro: tipoLogradouro.trim() || null,
        logradouro: logradouro.trim() || null,
        numero: numero.trim() || null,
        bairro: bairro.trim() || null,
        cep: cep.trim() || null,
        complemento: complemento.trim() || null,
        idCidade: idCidade === "" ? null : idCidade,
        timbrado: timbrado.trim() || null,
        timbradoVigenciaInicio: timbradoInicio.trim() || null,
        timbradoVigenciaFim: timbradoFim.trim() || null,
        estabelecimentoNumero: estabelecimento.trim() || null,
        pontoExpedicao: pontoExpedicao.trim() || null,
        principal,
        listarApenasClientesFilial: editandoFilial?.listarApenasClientesFilial ?? true,
        listarApenasFornecedoresFilial: editandoFilial?.listarApenasFornecedoresFilial ?? true,
        listarApenasProdutosFilial: editandoFilial?.listarApenasProdutosFilial ?? true,
        status: statusFilial,
      };
      if (editandoFilial) await atualizarFilial(editandoFilial.id, body);
      else await criarFilial(body);
      setFilialForm("lista");
      setFiliais(await listarFiliais(empresa.id));
    } catch (e) {
      setErro(mensagemErroApi(e, t, "empresa.error.saveFailed"));
    } finally {
      setSalvandoFilial(false);
    }
  }

  async function excluirFilialItem(id: number) {
    if (!empresa || !window.confirm(t("empresa.confirmDeleteBranch"))) return;
    try {
      await excluirFilial(id);
      setFiliais(await listarFiliais(empresa.id));
    } catch (e) {
      setErro(mensagemErroApi(e, t, "empresa.error.deleteFailed"));
    }
  }

  if (!empresa) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)", color: v("--text") }}>
          {t("nav.empresa")}
        </h1>
        {erro ? <p className="text-sm" style={{ color: "#ef4444" }}>{erro}</p> : <p style={{ color: v("--text-muted") }}>{t("common.noRecords")}</p>}
      </div>
    );
  }

  if (filialForm === "form") {
    return (
      <div className="space-y-5 max-w-5xl">
        <button type="button" className="text-xs cursor-pointer" style={{ color: v("--text-muted") }} onClick={() => setFilialForm("lista")}>
          ← {t("common.back")}
        </button>
        <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)", color: v("--text") }}>
          {editandoFilial ? t("empresa.branchEdit") : t("empresa.branchNew")}
        </h1>
        <form className="rounded-lg p-5 space-y-5" style={{ background: v("--card"), border: `1px solid ${v("--border")}` }}
          onSubmit={(e) => { e.preventDefault(); void salvarFilial(); }}>
          {erro && <p className="text-sm" style={{ color: "#ef4444" }}>{erro}</p>}
          <div className="form-grid-2">
            <Section title={t("papel.section.identification")}>
              <Field label={t("common.name")} required>
                <input className="field" autoFocus value={nomeFilial} onChange={(e) => setNomeFilial(e.target.value)}
                  onBlur={() => setNomeFilial((x) => toTitleCase(x))} />
              </Field>
              <div className="grid gap-3 mt-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <Field label={t("empresa.principal")}>
                  <select className="field" value={principal ? "sim" : "nao"} onChange={(e) => setPrincipal(e.target.value === "sim")}>
                    <option value="sim">{t("common.yes")}</option>
                    <option value="nao">{t("common.no")}</option>
                  </select>
                </Field>
                {editandoFilial && (
                  <Field label={t("common.status")}>
                    <select className="field" value={statusFilial} onChange={(e) => setStatusFilial(e.target.value as "ativo" | "inativo")}>
                      <option value="ativo">{t("common.active")}</option>
                      <option value="inativo">{t("common.inactive")}</option>
                    </select>
                  </Field>
                )}
              </div>
            </Section>
            <Section title={t("papel.section.contact")}>
              <DdiSearchSelect ddi={ddi} telefone={telefone} onChange={({ ddi: d, telefone: tel }) => { setDdi(d); setTelefone(tel); }} />
              <Field label={t("common.email")} className="mt-3">
                <input className="field" type="email" value={email} onChange={(e) => setEmail(toEmailLower(e.target.value))} />
              </Field>
            </Section>
          </div>
          <Section title={t("papel.section.address")}>
            <div className="grid gap-3" style={{ gridTemplateColumns: "6rem 1fr 5rem" }}>
              <Field label={t("papel.streetType")}>
                <input className="field" value={tipoLogradouro} onChange={(e) => setTipoLogradouro(e.target.value)} onBlur={() => setTipoLogradouro((x) => toTitleCase(x))} />
              </Field>
              <Field label={t("papel.street")}>
                <input className="field" value={logradouro} onChange={(e) => setLogradouro(e.target.value)} onBlur={() => setLogradouro((x) => toTitleCase(x))} />
              </Field>
              <Field label={t("papel.number")}>
                <input className="field" value={numero} onChange={(e) => setNumero(e.target.value)} />
              </Field>
            </div>
            <div className="grid gap-3 mt-3" style={{ gridTemplateColumns: "1fr 9rem 1fr" }}>
              <Field label={t("papel.neighborhood")}>
                <input className="field" value={bairro} onChange={(e) => setBairro(e.target.value)} onBlur={() => setBairro((x) => toTitleCase(x))} />
              </Field>
              <Field label={t("papel.postalCode")}>
                <input className="field font-mono" value={cep} onChange={(e) => setCep(normalizarCep(e.target.value))} />
              </Field>
              <Field label={t("papel.complement")}>
                <input className="field" value={complemento} onChange={(e) => setComplemento(e.target.value)} />
              </Field>
            </div>
            <Field label={t("papel.city")} className="mt-3">
              <CidadeSearchSelect cidades={cidades} value={idCidade} onChange={setIdCidade} />
            </Field>
          </Section>
          <Section title={t("empresa.timbrado")}>
            <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
              <Field label={t("empresa.timbrado")}>
                <input className="field font-mono" value={timbrado} onChange={(e) => setTimbrado(e.target.value)} />
              </Field>
              <Field label={t("empresa.timbradoInicio")}>
                <input className="field font-mono" placeholder="YYYY-MM-DD" value={timbradoInicio} onChange={(e) => setTimbradoInicio(e.target.value)} />
              </Field>
              <Field label={t("empresa.timbradoFim")}>
                <input className="field font-mono" placeholder="YYYY-MM-DD" value={timbradoFim} onChange={(e) => setTimbradoFim(e.target.value)} />
              </Field>
              <Field label={t("empresa.estabelecimento")}>
                <input className="field font-mono" value={estabelecimento} onChange={(e) => setEstabelecimento(e.target.value)} />
              </Field>
            </div>
            <Field label={t("empresa.pontoExpedicao")} className="mt-3">
              <input className="field font-mono max-w-xs" value={pontoExpedicao} onChange={(e) => setPontoExpedicao(e.target.value)} />
            </Field>
          </Section>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost px-4 py-2 text-sm" onClick={() => setFilialForm("lista")}>{t("common.cancel")}</button>
            <button type="submit" disabled={salvandoFilial} className="btn-gold px-5 py-2 text-sm">{salvandoFilial ? t("common.saving") : t("common.save")}</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)", color: v("--text") }}>
        {t("empresa.title")}
      </h1>
      {erro && <p className="text-sm" style={{ color: "#ef4444" }}>{erro}</p>}

      <form className="rounded-lg p-5 space-y-4" style={{ background: v("--card"), border: `1px solid ${v("--border")}` }}
        onSubmit={(e) => { e.preventDefault(); void salvarEmpresa(); }}>
        <Section title={t("empresa.section.company")}>
          <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <Field label={t("empresa.razaoSocial")} required>
              <input className="field" value={razaoSocial} onChange={(e) => setRazaoSocial(e.target.value)} onBlur={() => setRazaoSocial((x) => toTitleCase(x))} />
            </Field>
            <Field label={t("empresa.nomeFantasia")} required>
              <input className="field" value={nomeFantasia} onChange={(e) => setNomeFantasia(e.target.value)} onBlur={() => setNomeFantasia((x) => toTitleCase(x))} />
            </Field>
            <Field label={t("empresa.ruc")} required>
              <input className="field font-mono" value={ruc} onChange={(e) => setRuc(e.target.value)} />
            </Field>
            <Field label={t("common.status")}>
              <select className="field" value={statusEmpresa} onChange={(e) => setStatusEmpresa(e.target.value as "ativo" | "inativo")}>
                <option value="ativo">{t("common.active")}</option>
                <option value="inativo">{t("common.inactive")}</option>
              </select>
            </Field>
            <Field label={t("empresa.representanteNome")}>
              <input className="field" value={representanteNome} onChange={(e) => setRepresentanteNome(e.target.value)}
                onBlur={() => setRepresentanteNome((x) => toTitleCase(x))} />
            </Field>
            <Field label={t("empresa.representanteDocumento")}>
              <input className="field font-mono" value={representanteDocumento} onChange={(e) => setRepresentanteDocumento(e.target.value)} />
            </Field>
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" disabled={salvandoEmpresa} className="btn-gold px-5 py-2 text-sm">{salvandoEmpresa ? t("common.saving") : t("common.save")}</button>
          </div>
        </Section>
      </form>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium" style={{ color: v("--text-sub") }}>{t("empresa.section.branches")}</h2>
          <button type="button" className="btn-gold px-4 py-2 text-sm" onClick={() => abrirFilial()}>{t("empresa.branchNew")}</button>
        </div>
        <div className="rounded-lg overflow-hidden" style={{ background: v("--card"), border: `1px solid ${v("--border")}` }}>
          <table className="drive-table w-full">
            <thead>
              <tr style={{ borderBottom: `1px solid ${v("--border")}` }}>
                <th className="text-left px-4 py-2 text-xs font-medium" style={{ color: v("--text-muted") }}>{t("common.name")}</th>
                <th className="text-left px-4 py-2 text-xs font-medium" style={{ color: v("--text-muted") }}>{t("papel.city")}</th>
                <th className="text-left px-4 py-2 text-xs font-medium" style={{ color: v("--text-muted") }}>{t("empresa.principal")}</th>
                <th className="text-left px-4 py-2 text-xs font-medium" style={{ color: v("--text-muted") }}>{t("common.status")}</th>
                <th className="drive-td-actions px-2 py-2" aria-label={t("empresa.branchParameters")} />
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {filiais.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-6 text-sm text-center" style={{ color: v("--text-muted") }}>{t("common.noRecords")}</td></tr>
              ) : filiais.map((f) => (
                <tr key={f.id} style={{ borderBottom: `1px solid ${v("--border")}` }}>
                  <td className="px-4 py-2.5 text-sm" style={{ color: v("--text") }}>{f.nome}</td>
                  <td className="px-4 py-2.5 text-sm" style={{ color: v("--text-sub") }}>
                    {f.cidadeNome ? `${f.cidadeNome}${f.divisaoSigla ? ` (${f.divisaoSigla})` : ""}` : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-sm">{f.principal ? t("common.yes") : t("common.no")}</td>
                  <td className="px-4 py-2.5"><StatusBadge status={f.status === "inativo" ? "inativo" : "ativo"} /></td>
                  <td className="drive-td-actions px-2 py-2.5">
                    <FilialParametrosIconButton
                      label={t("empresa.branchParameters")}
                      onClick={() => setParametrosFilial(f)}
                    />
                  </td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    <button type="button" className="btn-ghost px-2 py-1 text-xs mr-1" onClick={() => abrirFilial(f)}>{t("common.edit")}</button>
                    {!f.principal && (
                      <button type="button" className="btn-ghost px-2 py-1 text-xs" style={{ color: "#ef4444" }} onClick={() => void excluirFilialItem(f.id)}>{t("common.delete")}</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {parametrosFilial && (
        <FilialParametrosModal
          filial={parametrosFilial}
          onClose={() => setParametrosFilial(null)}
          onSaved={(atualizada) => {
            setFiliais((lista) => lista.map((item) => (item.id === atualizada.id ? atualizada : item)));
          }}
        />
      )}
    </div>
  );
}
