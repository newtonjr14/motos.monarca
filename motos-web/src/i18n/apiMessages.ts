import type { DocumentoConflito } from "@/api";
import { tf } from "@/i18n/format";
import type { TranslationKey } from "@/i18n/translations";

export function mensagemConflitoDocumento(
  conflito: DocumentoConflito,
  t: (key: TranslationKey) => string,
): string {
  if (conflito.codigo === "DOCUMENTO_POSSIVEL_DUPLICADO") {
    return t("error.conflict.possibleDuplicate");
  }
  if (conflito.codigo === "DOCUMENTO_UNICO") {
    const match = conflito.message.match(/(?:com|con)\s+(.+?)\s+(\S+)\s*$/i);
    if (match) {
      return tf(t, "error.conflict.docUnique", { tipo: match[1], numero: match[2] });
    }
  }
  return conflito.message;
}

export function mensagemErroApi(
  e: unknown,
  t: (key: TranslationKey) => string,
  fallback: TranslationKey,
): string {
  return e instanceof Error ? e.message : t(fallback);
}
