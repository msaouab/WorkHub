import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { SpaceMembersStub } from '@/components/spaces/space-members-stub';

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });
  return {
    title: t('spaceMembersTitle'),
    description: t('spaceMembersDescription'),
  };
}

export default async function SpaceMembersPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <SpaceMembersStub />;
}
