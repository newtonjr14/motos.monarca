import type { TranslationKey } from "./translations";

export function tf(
  t: (key: TranslationKey) => string,
  key: TranslationKey,
  vars?: Record<string, string>,
): string {
  let text = t(key);
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replaceAll(`{${name}}`, value);
    }
  }
  return text;
}
