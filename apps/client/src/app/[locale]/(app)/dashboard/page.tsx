import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';
import { DashboardHome } from '@/components/dashboard/dashboard-home';
import { PlainAppShell } from '@/components/shell/plain-app-shell';

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });
  return {
    title: t('appTitle'),
    description: t('appDescription'),
  };
}

export default async function DashboardPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <PlainAppShell wide>
      <Suspense fallback={null}>
        <DashboardHome />
      </Suspense>
    </PlainAppShell>
  );
}
