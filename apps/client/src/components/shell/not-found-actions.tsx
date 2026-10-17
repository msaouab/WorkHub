'use client';

import { useTranslations } from 'next-intl';
import { buttonVariants } from '@/components/ui/button-variants';
import { useAuth } from '@/hooks/use-auth';
import { Link } from '@/i18n/navigation';
import { ROUTES } from '@/lib/routes';
import { cn } from '@/lib/utils';

export function NotFoundActions() {
  const t = useTranslations('NotFound');
  const { isSignedIn, isPending } = useAuth();

  return (
    <div className="mt-8 flex flex-wrap gap-3">
      {isPending || isSignedIn ? (
        <Link
          href={ROUTES.dashboard}
          className={cn(buttonVariants())}
        >
          {t('goDashboard')}
        </Link>
      ) : null}
      <Link
        href="/"
        className={cn(
          buttonVariants({
            variant: isSignedIn ? 'outline' : 'default',
          })
        )}
      >
        {t('goHome')}
      </Link>
    </div>
  );
}
