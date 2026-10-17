import type { Metadata } from 'next';
import { PERMISSIONS } from '@work-hub/constants';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { SpaceFeaturePage } from '@/components/shell/space-feature-page';

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });
  return {
    title: t('spaceApprovalsTitle'),
  };
}

export default async function Page({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <SpaceFeaturePage
      feature="approvals"
      icon="checks"
      permission={[PERMISSIONS.LEAVE_APPROVE, PERMISSIONS.DOCUMENTS_FULFIL]}
    />
  );
}
