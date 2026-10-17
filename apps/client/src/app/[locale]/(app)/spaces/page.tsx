import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PlainAppShell } from '@/components/shell/plain-app-shell';
import { SpacePicker } from '@/components/spaces/space-picker';

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });
  return {
    title: t('spacesTitle'),
    description: t('spacesDescription'),
  };
}

export default async function SpacesPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <PlainAppShell>
      <SpacePicker />
    </PlainAppShell>
  );
}
