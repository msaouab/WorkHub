import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { VerifyEmailPanel } from '@/components/auth/verify-email-panel';
import { Link } from '@/i18n/navigation';

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ email?: string; next?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });
  return {
    title: t('verifyEmailTitle'),
    description: t('verifyEmailDescription'),
  };
}

export default async function VerifyEmailPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Auth.verifyEmail');
  const query = await searchParams;
  const email = query.email?.trim() ?? '';

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {t('title')}
        </h1>
      </div>
      {email ? (
        <VerifyEmailPanel email={email} next={query.next} />
      ) : (
        <p className="text-sm text-muted-foreground">
          {t.rich('missingEmail', {
            link: (chunks) => (
              <Link
                href="/sign-up"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                {chunks}
              </Link>
            ),
          })}
        </p>
      )}
    </div>
  );
}
