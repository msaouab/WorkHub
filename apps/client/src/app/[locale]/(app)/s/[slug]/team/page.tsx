import type { Metadata } from 'next';
import { PERMISSIONS } from '@work-hub/constants';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { RequireSpacePermission } from '@/components/shell/require-space-permission';
import { TeamPage } from '@/components/team/team-page';

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });
  return {
    title: t('spaceTeamTitle'),
  };
}

export default async function Page({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { tab } = await searchParams;
  setRequestLocale(locale);
  return (
    <RequireSpacePermission permission={PERMISSIONS.MEMBERS_READ}>
      <TeamPage initialTab={tab} />
    </RequireSpacePermission>
  );
}
