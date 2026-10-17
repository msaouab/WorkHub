'use client';

import { MenuIcon } from 'lucide-react';
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
};

export function TopBar({ onOpenMobileNav, breadcrumb }: TopBarProps) {
  const t = useTranslations('Shell');

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur">
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
          <span className="hidden truncate text-sm text-muted-foreground sm:inline">
            {breadcrumb}
          </span>
        ) : null}
        <div className="ms-auto flex items-center gap-2">
          <LocaleSwitcher />
          <AuthNav />
        </div>
      </div>
    </header>
  );
}
