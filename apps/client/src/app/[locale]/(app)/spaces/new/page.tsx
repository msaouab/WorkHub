import type { Metadata } from 'next';
import { ArrowLeftIcon } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PlainAppShell } from '@/components/shell/plain-app-shell';
import { CreateSpaceForm } from '@/components/spaces/create-space-form';
import { buttonVariants } from '@/components/ui/button-variants';
import { Link } from '@/i18n/navigation';
import { ROUTES } from '@/lib/routes';
import { cn } from '@/lib/utils';

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });
  return {
    title: t('spacesNewTitle'),
    description: t('spacesNewDescription'),
  };
}

export default async function NewSpacePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Spaces.create' });

  return (
    <PlainAppShell>
      <div className="flex flex-col gap-6">
        <div>
          <Link
            href={ROUTES.dashboard}
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              '-ms-2 mb-2 text-muted-foreground'
            )}
          >
            <ArrowLeftIcon
              data-icon="inline-start"
              className="rtl:rotate-180"
              aria-hidden
            />
            {t('backToDashboard')}
          </Link>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            {t('title')}
          </h1>
          <p className="mt-3 text-muted-foreground">{t('description')}</p>
        </div>
        <CreateSpaceForm />
      </div>
    </PlainAppShell>
  );
}
