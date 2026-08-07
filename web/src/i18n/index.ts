import { createContext, useContext } from 'react';
import { en, type Dict, type DictKey } from './en';
import { ar, fr, es, tr, id, ms, ur, fa, bn } from './locales';

/** The same ten locales the terminal UI and the READMEs ship in. */
export const LANGS = [
  { code: 'en', label: 'English',    native: 'English',    dir: 'ltr' },
  { code: 'ar', label: 'Arabic',     native: 'العربية',     dir: 'rtl' },
  { code: 'fr', label: 'French',     native: 'Français',   dir: 'ltr' },
  { code: 'es', label: 'Spanish',    native: 'Español',    dir: 'ltr' },
  { code: 'tr', label: 'Turkish',    native: 'Türkçe',     dir: 'ltr' },
  { code: 'id', label: 'Indonesian', native: 'Indonesia',  dir: 'ltr' },
  { code: 'ms', label: 'Malay',      native: 'Melayu',     dir: 'ltr' },
  { code: 'ur', label: 'Urdu',       native: 'اردو',        dir: 'rtl' },
  { code: 'fa', label: 'Persian',    native: 'فارسی',       dir: 'rtl' },
  { code: 'bn', label: 'Bengali',    native: 'বাংলা',       dir: 'ltr' },
] as const;

export type Lang = (typeof LANGS)[number]['code'];

export const DICTS: Record<Lang, Partial<Dict>> = { en, ar, fr, es, tr, id, ms, ur, fa, bn };

export const isRtl = (l: Lang): boolean => LANGS.find((x) => x.code === l)?.dir === 'rtl';

export const langMeta = (l: Lang) => LANGS.find((x) => x.code === l) ?? LANGS[0];

/** Translate `key` for `lang`, falling back to English for anything untranslated. */
export function translate(lang: Lang, key: DictKey): string {
  return (DICTS[lang]?.[key] as string | undefined) ?? en[key];
}

/**
 * Resolve the initial language: an explicit `/xx/` path prefix wins (that is
 * what the hreflang alternates point at and what a search result links to),
 * then a stored preference, then the browser's own languages.
 */
export function detectLang(): Lang {
  if (typeof window === 'undefined') return 'en';
  const codes = LANGS.map((l) => l.code) as readonly string[];

  const fromPath = window.location.pathname.split('/')[1];
  if (codes.includes(fromPath)) return fromPath as Lang;

  try {
    const stored = localStorage.getItem('tabligh.lang');
    if (stored && codes.includes(stored)) return stored as Lang;
  } catch { /* private mode */ }

  for (const nav of navigator.languages ?? [navigator.language]) {
    const base = nav.toLowerCase().split('-')[0];
    if (codes.includes(base)) return base as Lang;
  }
  return 'en';
}

export interface I18n {
  lang: Lang;
  rtl: boolean;
  setLang: (l: Lang) => void;
  t: (key: DictKey) => string;
}

export const I18nContext = createContext<I18n>({
  lang: 'en',
  rtl: false,
  setLang: () => {},
  t: (k) => en[k],
});

export const useI18n = (): I18n => useContext(I18nContext);

/** `t` with `{n}`-style interpolation, for the few strings that need a number. */
export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

export type { Dict, DictKey };
