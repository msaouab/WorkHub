'use client';

import { useLocale } from 'next-intl';
import { isAppLocale, localeDirection } from '@/i18n/locale';

export function useDirection(): 'ltr' | 'rtl' {
  const locale = useLocale();
  return isAppLocale(locale) ? localeDirection(locale) : 'ltr';
}
