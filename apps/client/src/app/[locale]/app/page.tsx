import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AppHome } from '@/components/auth/app-home';
import { AppHeader } from '@/components/layout/app-header';
import { SiteFooter } from '@/components/landing/site-footer';

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });
  return { title: t('appTitle'), description: t('appDescription') };
}

export default async function AppPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="flex min-h-svh flex-col">
      <AppHeader />
      <section className="relative flex-1 overflow-hidden px-6 py-16 sm:px-8 sm:py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,oklch(0.92_0.035_145),transparent_40%),radial-gradient(circle_at_90%_80%,oklch(0.94_0.02_100),transparent_35%)]"
        />
        <div className="relative mx-auto w-full max-w-xl">
          <AppHome />
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
