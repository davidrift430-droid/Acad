// Tiny i18n: each key holds [Português, English, Español]. Params use {name} placeholders.
import { useStore } from '../db/store';
import type { Lang } from '../core/types';
import { DICT } from './dict';

const IDX: Record<Lang, 0 | 1 | 2> = { pt: 0, en: 1, es: 2 };

export function translate(lang: Lang, key: string, params?: Record<string, string | number>): string {
  const row = DICT[key];
  let s = row ? row[IDX[lang]] || row[1] : key;
  if (params) for (const [k, v] of Object.entries(params)) s = s.split(`{${k}}`).join(String(v));
  return s;
}

export type T = (key: string, params?: Record<string, string | number>) => string;

export function useT(): T {
  const lang = useStore((s) => s.settings.lang);
  return (key, params) => translate(lang, key, params);
}

export function useLang(): Lang {
  return useStore((s) => s.settings.lang);
}
