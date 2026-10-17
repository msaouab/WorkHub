import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { SpaceHome } from '@/components/spaces/space-home';

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });
  return {
    title: t('spaceTitle', { name: slug }),
    description: t('spaceDescription'),
  };
}

export default async function SpacePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <SpaceHome />;
}
