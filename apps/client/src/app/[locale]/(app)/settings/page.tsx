import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { SettingsAvatar } from '@/components/account/settings-avatar';
import { SettingsProfileForm } from '@/components/account/settings-profile-form';

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
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {t('profileTitle')}
        </h1>
        <p className="mt-2 text-muted-foreground">{t('description')}</p>
      </div>
      <SettingsAvatar />
      <hr className="border-border/80" />
      <SettingsProfileForm />
    </div>
  );
}
