import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { localeLabel, translations, countryTranslationKey, type Locale, type TranslationKey } from "./translations";

const STORAGE_KEY = "monarca.locale";

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
  localeShort: string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (initialLocale) return initialLocale;
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "es" ? "es" : "pt";
  });

  useEffect(() => {
    if (initialLocale) setLocaleState(initialLocale);
  }, [initialLocale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.lang = next === "pt" ? "pt-BR" : "es";
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale === "pt" ? "pt-BR" : "es";
  }, [locale]);

  const t = useCallback((key: TranslationKey) => translations[locale][key], [locale]);

  const value = useMemo(
    () => ({ locale, setLocale, t, localeShort: localeLabel(locale) }),
    [locale, setLocale, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

export { countryTranslationKey, localeLabel, translations, type Locale, type TranslationKey } from "./translations";
