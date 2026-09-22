import { ApiError, type DocumentoConflito, type VinculoFilialConflito } from "@/api";
import { translations, type TranslationKey } from "@/i18n/translations";
import { tf } from "@/i18n/format";

const CODIGOS_CAMPO_DOCUMENTO = new Set([
  "CPF_TAMANHO",
  "CPF_INVALIDO",
  "CNPJ_TAMANHO",
  "CNPJ_INVALIDO",
  "CNPJ_DV_NUMERICO",
  "CI_TAMANHO",
  "RUC_FORMATO",
  "RUC_INVALIDO",
  "RUC_BASE",
  "RUC_DV",
  "DOCUMENTO_OBRIGATORIO",
  "DOCUMENTO_TIPO_XOR",
  "DOCUMENTO_TIPO_OBRIGATORIO",
  "DOCUMENTO_TIPO_PAIS",
  "DOCUMENTO_TIPO_PESSOA",
  "DOCUMENTO_NUMERO_OBRIGATORIO",
  "DOCUMENTOS_REPETIDOS",
]);

/** Papel existe, mas sem vínculo ativo na filial atual (ex.: após “excluir” o vínculo). */
export function conflitoSemVinculoNaFilial(
  conflito: DocumentoConflito | VinculoFilialConflito,
  idFilial: number | null | undefined,
): boolean {
  if (conflito.codigo === "VINCULO_FILIAL") return false;
  if (conflito.idPapel == null) return false;
  const filiais = conflito.filiaisVinculadas ?? [];
  if (idFilial == null) return filiais.length === 0;
  return !filiais.some((f) => f.id === idFilial);
}

export function mensagemConflitoDocumento(
  conflito: DocumentoConflito,
  t: (key: TranslationKey) => string,
  opts?: { idFilial?: number | null },
): string {
  if (conflito.codigo === "DOCUMENTO_POSSIVEL_DUPLICADO") {
    return t("error.conflict.possibleDuplicate");
  }
  if (conflito.codigo === "DOCUMENTO_UNICO") {
    if (conflitoSemVinculoNaFilial(conflito, opts?.idFilial)) {
      return tf(t, "error.conflict.docUnlinked", conflito.params);
    }
    return tf(t, "error.conflict.docUnique", conflito.params);
  }
  return mensagemErroApi(conflito, t, "common.error.saveFailed");
}

export function isErroCampoDocumento(e: unknown): boolean {
  const codigo = corpoErro(e)?.codigo;
  return !!codigo && CODIGOS_CAMPO_DOCUMENTO.has(codigo);
}

export function mensagemErroApi(
  e: unknown,
  t: (key: TranslationKey) => string,
  fallback: TranslationKey,
): string {
  const body = corpoErro(e);
  if (body?.codigo) {
    const key = `api.${body.codigo}` as TranslationKey;
    if (Object.prototype.hasOwnProperty.call(translations.pt, key)) {
      return tf(t, key, body.params);
    }
  }
  if (!(e instanceof Error)) return t(fallback);
  const msg = e.message;
  if (/SYSTEM/i.test(msg) && /alterad|exclu|modific/i.test(msg)) {
    return t("api.SYSTEM_PROTEGIDO");
  }
  return t(fallback);
}

function corpoErro(e: unknown): { codigo?: string; params?: Record<string, string> } | null {
  if (e instanceof ApiError && e.body && typeof e.body === "object") {
    const body = e.body as { codigo?: string; params?: Record<string, string> };
    return { codigo: body.codigo, params: body.params };
  }
  if (e && typeof e === "object" && "codigo" in e) {
    const body = e as { codigo?: string; params?: Record<string, string> };
    return { codigo: body.codigo, params: body.params };
  }
  return null;
}
