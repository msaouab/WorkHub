'use client';

import type { Locale } from '@work-hub/constants';
import { useLocale, useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useUpdateMe } from '@/hooks/use-update-me';
import { isAppLocale } from '@/i18n/locale';
import { usePathname, useRouter } from '@/i18n/navigation';

export function useLocaleSwitcher() {
  const t = useTranslations('Locale');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { isSignedIn } = useAuth();
  const updateMe = useUpdateMe();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function switchLocale(next: string) {
    if (!isAppLocale(next) || next === locale) {
      return;
    }

    const nextLocale: Locale = next;
    const signedIn = isSignedIn;

    startTransition(async () => {
      setError(null);

      if (signedIn) {
        try {
          await updateMe.mutateAsync({ locale: nextLocale });
        } catch {
          setError(t('saveFailed'));
          return;
        }
      }

      router.replace(pathname, { locale: nextLocale });
    });
  }

  return {
    locale: isAppLocale(locale) ? locale : undefined,
    switchLocale,
    pending: pending || updateMe.isPending,
    error,
    clearError: () => setError(null),
  };
}
