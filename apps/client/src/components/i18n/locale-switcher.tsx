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
import { useLocaleSwitcher } from '@/hooks/use-locale-switcher';
import { cn } from '@/lib/utils';

type LocaleSwitcherProps = {
  tone?: 'default' | 'inverse';
  className?: string;
};

export function LocaleSwitcher({
  tone = 'default',
  className,
}: LocaleSwitcherProps) {
  const t = useTranslations('Locale');
  const tCommon = useTranslations('Common');
  const { locale, switchLocale, pending, error } = useLocaleSwitcher();
  const inverse = tone === 'inverse';

  if (!locale) {
    return null;
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={pending}
          aria-label={tCommon('language')}
          className={cn(
            buttonVariants({ variant: 'ghost' }),
            'gap-1 pe-2',
            inverse &&
              'text-white/85 hover:bg-white/10 hover:text-white data-popup-open:bg-white/10 data-popup-open:text-white',
            className
          )}
        >
          <span>{t(locale)}</span>
          <ChevronDownIcon className="size-3.5 opacity-70" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-36 w-auto">
          <DropdownMenuRadioGroup value={locale} onValueChange={switchLocale}>
            {LOCALES.map((code) => (
              <DropdownMenuRadioItem
                key={code}
                value={code}
                disabled={pending}
              >
                {t(code)}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      {error ? (
        <p className="max-w-48 text-end text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
