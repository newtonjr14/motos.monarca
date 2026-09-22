import {
  ApiError,
  criarPapel,
  listarPaises,
  listarTipos,
  type DocumentoConflito,
  type DocumentoTipo,
  type Pais,
  type TipoPessoa,
  type VinculoFilialConflito,
} from "@/api";
import { Field } from "@/components/crud/Field";
import { useFilialId } from "@/auth/FilialContext";
import { apenasDigitos, toTitleCase } from "@/format";
import { conflitoSemVinculoNaFilial, mensagemConflitoDocumento, mensagemErroApi, isErroCampoDocumento } from "@/i18n/apiMessages";
import { useI18n } from "@/i18n";
import { tf } from "@/i18n/format";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const v = (name: string) => `var(${name})`;
const border1 = () => `1px solid ${v("--border")}`;

/** Cadastro mínimo de cliente no PDV — overlay no padrão das fichas, sem sair da venda. */
export default function ClienteRapidoModal({
  nomeInicial = "",
  onClose,
  onCriado,
}: {
  nomeInicial?: string;
  onClose: () => void;
  onCriado: (idCliente: number) => void;
}) {
  const { t } = useI18n();
  const idFilial = useFilialId();
  const [paises, setPaises] = useState<Pais[]>([]);
  const [tipos, setTipos] = useState<DocumentoTipo[]>([]);
  const [nome, setNome] = useState(nomeInicial);
  const [tipoPessoa, setTipoPessoa] = useState<TipoPessoa>("fisica");
  const [idPais, setIdPais] = useState<number | "">("");
  const [idTipo, setIdTipo] = useState<number | "">("");
  const [numero, setNumero] = useState("");
  const [ddi, setDdi] = useState("595");
  const [telefone, setTelefone] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [erroNumero, setErroNumero] = useState<string | null>(null);
  const [conflito, setConflito] = useState<DocumentoConflito | VinculoFilialConflito | null>(null);
  const [idPessoaPendente, setIdPessoaPendente] = useState<number | null>(null);
  const [salvando, setSalvando] = useState(false);

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
    void listarPaises().then((lista) => {
      setPaises(lista);
      const py = lista.find((p) => p.sigla?.toUpperCase() === "PY");
      setIdPais(py?.id ?? lista[0]?.id ?? "");
    }).catch(() => setPaises([]));
  }, []);

  useEffect(() => {
    if (idPais === "") {
      setTipos([]);
      setIdTipo("");
      return;
    }
    void listarTipos(Number(idPais), tipoPessoa).then((lista) => {
      setTipos(lista);
      const preferido = lista.find((x) => ["CI", "RUC", "CPF"].includes(x.codigo.toUpperCase()))
        ?? lista[0];
      setIdTipo(preferido?.id ?? "");
    }).catch(() => {
      setTipos([]);
      setIdTipo("");
    });
  }, [idPais, tipoPessoa]);

  async function salvar(idPessoaExistente?: number, confirmarVinculoFilial = false) {
    setErro(null);
    setErroNumero(null);
    if (idPessoaExistente == null) {
      if (!nome.trim()) {
        setErro(t("papel.error.nameRequired"));
        return;
      }
      if (idPais === "" || idTipo === "") {
        setErro(t("papel.error.docRequired"));
        return;
      }
      if (!numero.trim()) {
        setErroNumero(t("papel.error.docNumberRequired"));
        return;
      }
      const ddiDigits = apenasDigitos(ddi);
      const telDigits = apenasDigitos(telefone);
      if (Boolean(ddiDigits) !== Boolean(telDigits)) {
        setErro(t("papel.error.phonePair"));
        return;
      }
    }

    setSalvando(true);
    try {
      let idCliente: number;
      if (idPessoaExistente != null) {
        const papel = await criarPapel("clientes", {
          idPessoa: idPessoaExistente,
          idFilialCadastro: idFilial,
          confirmarVinculoFilial,
          status: "ativo",
        });
        idCliente = papel.id;
      } else {
        const ddiDigits = apenasDigitos(ddi);
        const telDigits = apenasDigitos(telefone);
        const papel = await criarPapel("clientes", {
          status: "ativo",
          idFilialCadastro: idFilial,
          pessoa: {
            nomeRazaoSocial: toTitleCase(nome),
            tipoPessoa,
            ddi: ddiDigits || null,
            telefone: telDigits || null,
            email: null,
            enderecos: [],
            status: "ativo",
            documentos: [{
              idPais: Number(idPais),
              idTipoDocumento: Number(idTipo),
              numero: numero.trim(),
            }],
          },
        });
        idCliente = papel.id;
      }
      setConflito(null);
      onCriado(idCliente);
    } catch (e) {
      const msg = mensagemErroApi(e, t, "papel.error.saveFailed");
      if (e instanceof ApiError && e.status === 409) {
        const body = e.body as DocumentoConflito | VinculoFilialConflito;
        setConflito(body);
        if (body.codigo === "VINCULO_FILIAL") {
          setIdPessoaPendente(body.pessoa.id);
        } else if (body.idPapel != null) {
          onCriado(body.idPapel);
          return;
        } else {
          setIdPessoaPendente(body.pessoa.id);
        }
      } else if (isErroCampoDocumento(e)) {
        setErroNumero(msg);
      } else {
        setErro(msg);
      }
    } finally {
      setSalvando(false);
    }
  }

  function filiaisTexto(filiais: { nome: string }[] | undefined) {
    return (filiais ?? []).map((f) => f.nome).join(", ");
  }

  return createPortal(
    <div
      className="ficha-modal-overlay fixed inset-0 z-[210] flex items-start justify-center p-4 sm:p-6 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cliente-rapido-title"
    >
      <div
        className="ficha-modal w-full max-w-md rounded-xl shadow-2xl flex flex-col"
        style={{ background: v("--card"), border: border1() }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4" style={{ borderBottom: border1() }}>
          <h2 id="cliente-rapido-title" className="text-lg font-semibold" style={{ color: v("--text") }}>
            {t("venda.clienteRapido.title")}
          </h2>
          <p className="text-xs mt-1" style={{ color: v("--text-muted") }}>{t("venda.clienteRapido.hint")}</p>
        </div>

        <form
          className="px-5 py-4 space-y-3"
          onSubmit={(e) => { e.preventDefault(); void salvar(idPessoaPendente ?? undefined); }}
        >
          {erro && <p className="text-sm" style={{ color: "#ef4444" }}>{erro}</p>}

          {conflito && (
            <div className="p-3 rounded-md space-y-2" style={{ background: v("--gold-bg"), border: `1px solid ${v("--gold-border")}` }}>
              <p className="text-sm" style={{ color: v("--text") }}>
                {conflito.codigo === "VINCULO_FILIAL"
                  ? tf(t, "papel.conflict.linkBranch", {
                      nome: conflito.pessoa.nomeRazaoSocial,
                      filiais: filiaisTexto(conflito.filiaisVinculadas),
                      filialAlvo: "filialAlvoNome" in conflito ? conflito.filialAlvoNome : "",
                    })
                  : mensagemConflitoDocumento(conflito as DocumentoConflito, t, { idFilial: idFilial })}
              </p>
              <p className="text-sm font-medium" style={{ color: v("--text-sub") }}>{conflito.pessoa.nomeRazaoSocial}</p>
              {conflito.codigo === "VINCULO_FILIAL" ? (
                <button type="button" className="btn-gold px-3 py-1.5 text-sm" disabled={salvando}
                  onClick={() => void salvar(idPessoaPendente ?? conflito.pessoa.id, true)}>
                  {t("papel.confirmLinkBranch")}
                </button>
              ) : conflitoSemVinculoNaFilial(conflito, idFilial) || conflito.idPapel == null ? (
                <button type="button" className="btn-gold px-3 py-1.5 text-sm" disabled={salvando}
                  onClick={() => void salvar(conflito.pessoa.id)}>
                  {conflitoSemVinculoNaFilial(conflito, idFilial) ? t("papel.linkToBranch") : t("papel.useExisting")}
                </button>
              ) : null}
            </div>
          )}

          <Field label={t("papel.name")} required>
            <input className="field" autoFocus value={nome} onChange={(e) => setNome(e.target.value)}
              onBlur={() => setNome((n) => toTitleCase(n))} />
          </Field>

          <div className="form-grid-2">
            <Field label={t("papel.personType")}>
              <select className="field" value={tipoPessoa} onChange={(e) => setTipoPessoa(e.target.value as TipoPessoa)}>
                <option value="fisica">{t("papel.personType.fisica")}</option>
                <option value="juridica">{t("papel.personType.juridica")}</option>
              </select>
            </Field>
            <Field label={t("papel.country")} required>
              <select className="field" value={idPais === "" ? "" : String(idPais)}
                onChange={(e) => setIdPais(e.target.value ? Number(e.target.value) : "")}>
                <option value="">{t("common.select")}</option>
                {paises.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </Field>
          </div>

          <div className="form-grid-2">
            <Field label={t("papel.docType")} required>
              <select className="field" value={idTipo === "" ? "" : String(idTipo)}
                onChange={(e) => setIdTipo(e.target.value ? Number(e.target.value) : "")}>
                <option value="">{t("common.select")}</option>
                {tipos.map((tp) => <option key={tp.id} value={tp.id}>{tp.codigo} — {tp.nome}</option>)}
              </select>
            </Field>
            <Field label={t("papel.docNumber")} required error={erroNumero ?? undefined}>
              <input className="field font-mono" value={numero} onChange={(e) => setNumero(e.target.value)} />
            </Field>
          </div>

          <div className="form-grid-2">
            <Field label={t("ddi.label")}>
              <input className="field font-mono" value={ddi} onChange={(e) => setDdi(apenasDigitos(e.target.value).slice(0, 4))} />
            </Field>
            <Field label={t("ddi.phone")}>
              <input className="field font-mono" value={telefone} onChange={(e) => setTelefone(apenasDigitos(e.target.value).slice(0, 15))} />
            </Field>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost px-4 py-2" onClick={onClose}>{t("common.cancel")}</button>
            <button type="submit" className="btn-gold px-4 py-2" disabled={salvando}>
              {salvando ? t("common.loading") : t("common.save")}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
