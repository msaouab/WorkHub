import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { NotificationsComingSoon } from '@/components/shell/notifications-coming-soon';
import { PlainAppShell } from '@/components/shell/plain-app-shell';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });
  return {
    title: t('notificationsTitle'),
  };
}

export default async function NotificationsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <PlainAppShell>
      <NotificationsComingSoon />
    </PlainAppShell>
  );
}
