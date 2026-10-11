import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Clients } from '@/components/landing/clients';
import { FinalCta } from '@/components/landing/final-cta';
import { Hero } from '@/components/landing/hero';
import { Path } from '@/components/landing/path';
import { Problem } from '@/components/landing/problem';
import { Product } from '@/components/landing/product';
import { SiteFooter } from '@/components/landing/site-footer';
import { SiteHeader } from '@/components/landing/site-header';
import { Stats } from '@/components/landing/stats';

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });
  return { title: t('title'), description: t('description') };
}

export default async function Index({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main>
      <SiteHeader />
      <Hero />
      <Problem />
      <Clients />
      <Stats />
      <Product />
      <Path />
      <FinalCta />
      <SiteFooter />
    </main>
  );
}
