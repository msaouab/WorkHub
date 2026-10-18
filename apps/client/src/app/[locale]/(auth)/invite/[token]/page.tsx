import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';
import { AcceptInvite } from '@/components/invites/accept-invite';
import { LogoLoader } from '@/components/brand/logo-loader';

type PageProps = {
  params: Promise<{ locale: string; token: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });
  return {
    title: t('inviteAcceptTitle'),
  };
}

export default async function InviteAcceptPage({ params }: PageProps) {
  const { locale, token } = await params;
  setRequestLocale(locale);

  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-10">
          <LogoLoader size="lg" showLabel />
        </div>
      }
    >
      <AcceptInvite token={token} />
    </Suspense>
  );
}
