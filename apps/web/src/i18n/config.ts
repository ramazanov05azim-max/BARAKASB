import { en } from './resources/en';
import { ru, type TranslationKey } from './resources/ru';

export const locales = ['ru', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'ru';

export const resources: Record<Locale, Record<TranslationKey, string>> = {
  ru,
  en,
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && locales.includes(value as Locale);
}

export function translate(locale: Locale, key: TranslationKey): string {
  return resources[locale][key];
}

export type { TranslationKey };
