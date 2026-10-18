import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { SettingsAvatar } from '@/components/account/settings-avatar';
import { SettingsProfileForm } from '@/components/account/settings-profile-form';
import { PageHeader } from '@/components/shell/page-header';

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });
  return {
    title: t('settingsTitle'),
    description: t('settingsDescription'),
  };
}

export default async function SettingsProfilePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Account.settings' });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t('profileTitle')} description={t('description')} />
      <SettingsAvatar />
      <hr className="border-border" />
      <SettingsProfileForm />
    </div>
  );
}
