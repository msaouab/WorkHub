'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { TopBar } from '@/components/shell/top-bar';

type AppFrameProps = {
  children: ReactNode;
  onOpenMobileNav?: () => void;
  breadcrumb?: string;
  /** Wider content for dashboard cards. */
  wide?: boolean;
};

/** Shared signed-in chrome: skip link + top bar + main (no footer). */
export function AppFrame({
  children,
  onOpenMobileNav,
  breadcrumb,
  wide = false,
}: AppFrameProps) {
  const t = useTranslations('Shell');

  return (
    <div className="flex min-h-svh flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:inset-s-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-background focus:px-3 focus:py-2 focus:shadow focus:ring-2 focus:ring-ring"
      >
        {t('skipToContent')}
      </a>
      <TopBar onOpenMobileNav={onOpenMobileNav} breadcrumb={breadcrumb} />
      <div id="main-content" className="flex min-h-0 flex-1">
        {children}
      </div>
      {/* wide hint reserved for layouts that center content */}
      {wide ? null : null}
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
        `relative flex-1 overflow-y-auto px-4 py-8 sm:px-6 sm:py-10 ${
          wide ? '' : ''
        }`
      }
    >
      <div
        className={
          wide
            ? 'mx-auto w-full max-w-5xl'
            : 'mx-auto w-full max-w-xl'
        }
      >
        {children}
      </div>
    </main>
  );
}
