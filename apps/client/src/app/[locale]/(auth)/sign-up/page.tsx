import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';
import { SignUpForm } from '@/components/auth/sign-up-form';
import { LogoLoader } from '@/components/brand/logo-loader';

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const tMeta = await getTranslations({ locale, namespace: 'Metadata' });
  const t = await getTranslations({ locale, namespace: 'Auth.signUp' });
  return { title: tMeta('signUpTitle'), description: t('description') };
}

export default async function SignUpPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Auth.signUp');

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {t('title')}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('description')}</p>
      </div>
      <Suspense fallback={<LogoLoader className="self-center py-6" />}>
        <SignUpForm />
      </Suspense>
    </div>
  );
}
