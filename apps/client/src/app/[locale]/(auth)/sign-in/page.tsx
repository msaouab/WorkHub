import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';
import { SignInForm } from '@/components/auth/sign-in-form';

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });
  return {
    title: t('signInTitle'),
    description: (await getTranslations({ locale, namespace: 'Auth.signIn' }))(
      'description'
    ),
  };
}

export default async function SignInPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Auth.signIn');
  const tCommon = await getTranslations('Common');

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {t('title')}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('description')}</p>
      </div>
      <Suspense fallback={<p className="text-sm text-muted-foreground">{tCommon('loading')}</p>}>
        <SignInForm />
      </Suspense>
    </div>
  );
}
