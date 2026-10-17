import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { SettingsLanguageForm } from '@/components/account/settings-language-form';

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

export default async function SettingsLanguagePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Account.settings' });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {t('languageTitle')}
        </h1>
        <p className="mt-2 text-muted-foreground">{t('languageDescription')}</p>
      </div>
      <SettingsLanguageForm />
    </div>
  );
}
