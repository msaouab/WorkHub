import { RTL_LOCALES, type Locale } from '@work-hub/constants';
import { routing } from './routing';

export function isAppLocale(value: string): value is Locale {
  return (routing.locales as readonly string[]).includes(value);
}

export function localeDirection(locale: Locale): 'ltr' | 'rtl' {
  return RTL_LOCALES.includes(locale) ? 'rtl' : 'ltr';
}

/** Tailwind font class for locales that need a dedicated script font. */
export function localeFontClass(locale: Locale): string | undefined {
  return localeDirection(locale) === 'rtl' ? 'font-arabic' : undefined;
}
