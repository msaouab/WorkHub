'use client';

import { ArrowLeftIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import {
  SETTINGS_NAV_ITEMS,
  activeSettingsNavId,
} from '@/lib/nav/settings-nav';
import { ROUTES } from '@/lib/routes';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button-variants';

type SettingsNavProps = {
  onNavigate?: () => void;
  className?: string;
};

export function SettingsNav({ onNavigate, className }: SettingsNavProps) {
  const t = useTranslations('Shell.settingsNav');
  const tShell = useTranslations('Shell');
  const pathname = usePathname();
  const activeId = activeSettingsNavId(SETTINGS_NAV_ITEMS, pathname);

  return (
    <aside
      className={cn(
        'flex h-full min-h-0 w-56 flex-col overflow-hidden border-e border-border/80 bg-background',
        className
      )}
    >
      <div className="shrink-0 border-b border-border/60 p-2">
        <Link
          href={ROUTES.dashboard}
          onClick={onNavigate}
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'w-full justify-start text-muted-foreground'
          )}
        >
          <ArrowLeftIcon
            data-icon="inline-start"
            className="rtl:rotate-180"
            aria-hidden
          />
          {t('backToDashboard')}
        </Link>
      </div>
      <nav
        aria-label={tShell('settingsNavLabel')}
        className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto overscroll-contain p-2"
      >
        {SETTINGS_NAV_ITEMS.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            aria-current={activeId === item.id ? 'page' : undefined}
            title={
              item.status === 'soon'
                ? tShell('soonTitle', { label: t(item.labelKey as 'profile') })
                : undefined
            }
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring',
              item.danger && !activeId
                ? 'text-destructive hover:bg-destructive/10'
                : null,
              activeId === item.id
                ? item.danger
                  ? 'bg-destructive/15 text-destructive'
                  : 'bg-accent text-accent-foreground'
                : item.danger
                  ? null
                  : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
            )}
          >
            <span className="min-w-0 flex-1 truncate">
              {t(item.labelKey as 'profile')}
            </span>
            {item.status === 'soon' ? (
              <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
                {tShell('soon')}
              </span>
            ) : null}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
