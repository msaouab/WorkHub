'use client';

import { LOCALES } from '@work-hub/constants';
import { ChevronDownIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { buttonVariants } from '@/components/ui/button-variants';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { useLocaleSwitcher } from '@/hooks/use-locale-switcher';
import { cn } from '@/lib/utils';

export function SettingsLanguageForm() {
  const t = useTranslations('Account.settings');
  const tLocale = useTranslations('Locale');
  const { locale, switchLocale, pending, error } = useLocaleSwitcher();

  return (
    <div className="flex flex-col gap-2">
      <Label id="settings-locale-label">{t('languageTitle')}</Label>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-labelledby="settings-locale-label"
          disabled={pending || !locale}
          className={cn(
            buttonVariants({ variant: 'outline' }),
            'w-full max-w-sm justify-between gap-2 px-2.5 font-normal'
          )}
        >
          <span>{locale ? tLocale(locale) : '—'}</span>
          <ChevronDownIcon className="size-3.5 shrink-0 opacity-70" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-44">
          <DropdownMenuRadioGroup
            value={locale ?? undefined}
            onValueChange={switchLocale}
          >
            {LOCALES.map((code) => (
              <DropdownMenuRadioItem
                key={code}
                value={code}
                disabled={pending}
              >
                {tLocale(code)}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
