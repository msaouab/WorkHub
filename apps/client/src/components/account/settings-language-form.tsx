'use client';

import { LOCALES } from '@work-hub/constants';
import { useTranslations } from 'next-intl';
import { Label } from '@/components/ui/label';
import { useLocaleSwitcher } from '@/hooks/use-locale-switcher';

export function SettingsLanguageForm() {
  const t = useTranslations('Account.settings');
  const tLocale = useTranslations('Locale');
  const { locale, switchLocale, pending, error } = useLocaleSwitcher();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-xl font-semibold">
          {t('languageTitle')}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('languageDescription')}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="settings-locale">{t('languageTitle')}</Label>
        <select
          id="settings-locale"
          className="h-10 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
          value={locale ?? 'en'}
          disabled={pending}
          onChange={(event) => switchLocale(event.target.value)}
        >
          {LOCALES.map((code) => (
            <option key={code} value={code}>
              {tLocale(code)}
            </option>
          ))}
        </select>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
