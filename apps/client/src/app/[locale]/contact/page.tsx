import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ContactForm } from '@/components/contact/contact-form';
import { AppHeader } from '@/components/layout/app-header';
import { SiteFooter } from '@/components/landing/site-footer';

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const tMeta = await getTranslations({ locale, namespace: 'Metadata' });
  const t = await getTranslations({ locale, namespace: 'Contact' });
  return { title: tMeta('contactTitle'), description: t('description') };
}

export default async function ContactPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Contact');

  return (
    <main className="flex min-h-svh flex-col">
      <AppHeader />
      <section className="relative flex-1 overflow-hidden px-6 py-16 sm:px-8 sm:py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,oklch(0.92_0.035_145),transparent_40%),radial-gradient(circle_at_90%_80%,oklch(0.94_0.02_100),transparent_35%)]"
        />
        <div className="relative mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-start lg:gap-20">
          <div className="max-w-xl">
            <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              {t('title')}
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              {t('description')}
            </p>
          </div>
          <div className="rounded-2xl border border-border/80 bg-background/90 p-6 sm:p-8">
            <ContactForm />
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
