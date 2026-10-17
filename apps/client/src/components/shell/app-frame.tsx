'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { TopBar } from '@/components/shell/top-bar';

type AppFrameProps = {
  children: ReactNode;
  onOpenMobileNav?: () => void;
  breadcrumb?: string;
  searchWorkspaceName?: string;
  /** Wider content for dashboard cards. */
  wide?: boolean;
};

/** Shared signed-in chrome: skip link + top bar + main (no footer). */
export function AppFrame({
  children,
  onOpenMobileNav,
  breadcrumb,
  searchWorkspaceName,
}: AppFrameProps) {
  const t = useTranslations('Shell');

  return (
    <div className="flex h-svh flex-col overflow-hidden">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:inset-s-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-background focus:px-3 focus:py-2 focus:shadow focus:ring-2 focus:ring-ring"
      >
        {t('skipToContent')}
      </a>
      <TopBar
        onOpenMobileNav={onOpenMobileNav}
        breadcrumb={breadcrumb}
        searchWorkspaceName={searchWorkspaceName}
      />
      <div id="main-content" className="flex min-h-0 flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

export function AppMain({
  children,
  wide = false,
  className,
}: {
  children: ReactNode;
  wide?: boolean;
  className?: string;
}) {
  return (
    <main
      className={
        className ??
        'relative flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-8 sm:px-6 sm:py-10'
      }
    >
      <div
        className={
          wide
            ? 'mx-auto flex min-h-full w-full max-w-5xl flex-col'
            : 'mx-auto flex min-h-full w-full max-w-xl flex-col'
        }
      >
        {children}
      </div>
    </main>
  );
}
