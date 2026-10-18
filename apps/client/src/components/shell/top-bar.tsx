'use client';

import { BellIcon, MenuIcon, SearchIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AuthNav } from '@/components/auth/auth-nav';
import { Logo } from '@/components/brand/logo';
import { LocaleSwitcher } from '@/components/i18n/locale-switcher';
import { buttonVariants } from '@/components/ui/button-variants';
import { Link } from '@/i18n/navigation';
import { ROUTES } from '@/lib/routes';
import { cn } from '@/lib/utils';

type TopBarProps = {
  /** Show ☰ that opens the mobile drawer (workspace / settings). */
  onOpenMobileNav?: () => void;
  breadcrumb?: string;
  searchWorkspaceName?: string;
};

export function TopBar({
  onOpenMobileNav,
  breadcrumb,
  searchWorkspaceName,
}: TopBarProps) {
  const t = useTranslations('Shell');
  const tTop = useTranslations('Shell.topBar');

  return (
    <header className="sticky top-0 z-40 shrink-0 border-b border-border/80 bg-background/90 backdrop-blur">
      <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
        {onOpenMobileNav ? (
          <button
            type="button"
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              'lg:hidden'
            )}
            aria-label={t('openMenu')}
            onClick={onOpenMobileNav}
          >
            <MenuIcon className="size-4" />
          </button>
        ) : null}
        <Link
          href={ROUTES.dashboard}
          className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Logo />
        </Link>
        {breadcrumb ? (
          <span className="hidden max-w-40 truncate text-sm text-muted-foreground sm:inline lg:max-w-56">
            {breadcrumb}
          </span>
        ) : null}

        {searchWorkspaceName ? (
          <div
            className="ms-2 hidden min-w-0 flex-1 lg:block"
            title={tTop('searchSoon')}
          >
            <label className="relative block w-full max-w-70">
              <span className="sr-only">
                {tTop('searchPlaceholder', { name: searchWorkspaceName })}
              </span>
              <SearchIcon
                className="pointer-events-none absolute inset-s-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                type="search"
                readOnly
                tabIndex={0}
                placeholder={tTop('searchPlaceholder', {
                  name: searchWorkspaceName,
                })}
                className="h-8 w-full rounded-lg border border-border/80 bg-muted/40 pe-3 ps-9 text-sm text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onFocus={(e) => e.currentTarget.blur()}
                aria-describedby="wh-search-soon"
              />
              <span id="wh-search-soon" className="sr-only">
                {tTop('searchSoon')}
              </span>
            </label>
          </div>
        ) : null}

        <div className="ms-auto flex items-center gap-2">
          <Link
            href={ROUTES.notifications}
            className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
            aria-label={tTop('notifications')}
            title={tTop('notifications')}
          >
            <BellIcon className="size-4" />
          </Link>
          <LocaleSwitcher />
          <AuthNav />
        </div>
      </div>
    </header>
  );
}
