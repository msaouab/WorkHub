import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { SpaceSettings } from '@/components/spaces/space-settings';

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });
  return {
    title: t('spaceSettingsTitle'),
    description: t('spaceSettingsDescription'),
  };
}

export default async function SpaceSettingsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <SpaceSettings />;
}
