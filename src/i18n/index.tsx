import { no, type DictKey } from './no';
import { sq } from './sq';
import { useStore } from '../storage/store';

export const LANGUAGES = {
  no: { label: 'Norsk', flag: '🇳🇴', dict: no, speechLang: 'nb-NO', speechFallback: ['nb', 'no', 'nn'] },
  sq: { label: 'Shqip', flag: '🇦🇱', dict: sq, speechLang: 'sq-AL', speechFallback: ['sq'] }
} as const;

export type Lang = keyof typeof LANGUAGES;

export function translate(lang: Lang, key: DictKey, vars?: Record<string, string | number>): string {
  let s: string = LANGUAGES[lang].dict[key] ?? no[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}

/** Hook: const t = useT(); t('play') */
export function useT() {
  const lang = useStore((s) => s.settings.lang);
  return (key: DictKey, vars?: Record<string, string | number>) => translate(lang, key, vars);
}
