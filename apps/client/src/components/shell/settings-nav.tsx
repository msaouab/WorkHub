'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import {
  SETTINGS_NAV_ITEMS,
  activeSettingsNavId,
} from '@/lib/nav/settings-nav';
import { getLastSpaceSlug } from '@/lib/last-space';
import { ROUTES } from '@/lib/routes';
import { cn } from '@/lib/utils';
import { useSpaces } from '@/hooks/use-spaces';
import { useEffect, useState } from 'react';

type SettingsNavProps = {
  onNavigate?: () => void;
  className?: string;
};

export function SettingsNav({ onNavigate, className }: SettingsNavProps) {
  const t = useTranslations('Shell.settingsNav');
  const tShell = useTranslations('Shell');
  const pathname = usePathname();
  const activeId = activeSettingsNavId(SETTINGS_NAV_ITEMS, pathname);
  const { data: spaces } = useSpaces();
  const [backHref, setBackHref] = useState<string>(ROUTES.dashboard);
  const [backName, setBackName] = useState<string | null>(null);

  useEffect(() => {
    const last = getLastSpaceSlug();
    const match = last ? spaces?.find((s) => s.slug === last) : undefined;
    if (match) {
      setBackHref(`${ROUTES.space}/${match.slug}`);
      setBackName(match.name);
    } else if (spaces?.[0]) {
      setBackHref(`${ROUTES.space}/${spaces[0].slug}`);
      setBackName(spaces[0].name);
    } else {
      setBackHref(ROUTES.dashboard);
      setBackName(null);
    }
  }, [spaces]);

  return (
    <aside
      className={cn(
        'flex h-full w-56 flex-col border-e border-border/80 bg-background',
        className
      )}
    >
      <div className="border-b border-border/60 p-3">
        <Link
          href={backHref}
          onClick={onNavigate}
          className="block rounded-lg px-2.5 py-2 text-sm text-muted-foreground outline-none hover:bg-accent/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          {backName
            ? t('backTo', { name: backName })
            : t('backToDashboard')}
        </Link>
      </div>
      <nav
        aria-label={tShell('settingsNavLabel')}
        className="flex flex-col gap-0.5 p-2"
      >
        {SETTINGS_NAV_ITEMS.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            aria-current={activeId === item.id ? 'page' : undefined}
            onClick={onNavigate}
            className={cn(
              'rounded-lg px-2.5 py-2 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring',
              activeId === item.id
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
            )}
          >
            {t(item.labelKey as 'profile')}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
