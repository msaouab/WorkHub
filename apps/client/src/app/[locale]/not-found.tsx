import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { AppHeader } from '@/components/layout/app-header';
import { SiteFooter } from '@/components/landing/site-footer';
import { NotFoundActions } from '@/components/shell/not-found-actions';

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: false },
};

/** Localized 404 inside `[locale]` layout (WH-051). */
export default async function LocaleNotFound() {
  const t = await getTranslations('NotFound');

  return (
    <main className="flex min-h-svh flex-col">
      {/* React 19: overrides the static metadata title with the locale string. */}
      <title>{t('title')}</title>
      <AppHeader />
      <section className="relative flex flex-1 flex-col items-start justify-center px-6 py-16 sm:px-8">
        <p className="text-sm font-medium text-muted-foreground">{t('code')}</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {t('title')}
        </h1>
        <p className="mt-3 max-w-md text-muted-foreground">{t('description')}</p>
        <NotFoundActions />
      </section>
      <SiteFooter />
    </main>
  );
}
