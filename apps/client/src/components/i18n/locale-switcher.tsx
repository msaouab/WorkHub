'use client';

import { LOCALES, type Locale } from '@work-hub/constants';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronDownIcon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { buttonVariants } from '@/components/ui/button-variants';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useMe } from '@/hooks/use-me';
import { usePathname, useRouter } from '@/i18n/navigation';
import { updateMe } from '@/lib/api/me';
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
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { signedIn } = useMe();
  const [pending, startTransition] = useTransition();
  const inverse = tone === 'inverse';

  function onChange(next: string) {
    if (next === locale || !LOCALES.includes(next as Locale)) {
      return;
    }

    const nextLocale = next as Locale;

    startTransition(async () => {
      if (signedIn) {
        try {
          await updateMe({ locale: nextLocale });
          await queryClient.invalidateQueries({ queryKey: ['me'] });
        } catch {
          // Still switch UI locale even if preference sync fails.
        }
      }
      router.replace(pathname, { locale: nextLocale });
      router.refresh();
    });
  }

  return (
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
        <DropdownMenuRadioGroup value={locale} onValueChange={onChange}>
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
  );
}
