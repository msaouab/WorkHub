'use client';

import type { Permission } from '@work-hub/constants';
import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { PageLoader } from '@/components/brand/logo-loader';
import { buttonVariants } from '@/components/ui/button-variants';
import { useCurrentSpace } from '@/hooks/use-space';
import { Link } from '@/i18n/navigation';
import { hasNavPermission } from '@/lib/nav/space-nav';
import { ROUTES } from '@/lib/routes';
import { cn } from '@/lib/utils';

type RequireSpacePermissionProps = {
  permission?: Permission | readonly Permission[];
  children: ReactNode;
};

/**
 * Gate a workspace page by permission (WH-053).
 * Unknown / non-member → "not a member"; member without the permission → page forbidden.
 */
export function RequireSpacePermission({
  permission,
  children,
}: RequireSpacePermissionProps) {
  const t = useTranslations('Spaces.home');
  const { slug, space, isPending, isError, isForbidden } = useCurrentSpace();

  if (isPending) {
    return <PageLoader fill="parent" label={t('loading')} />;
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive" role="alert">
        {t('failed')}
      </p>
    );
  }

  if (isForbidden || !space) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            {t('noAccessTitle')}
          </h1>
          <p className="mt-3 text-muted-foreground">
            {t('noAccessDescription', { slug: slug ?? '' })}
          </p>
        </div>
        <Link
          href={ROUTES.spaces}
          className={cn(
            buttonVariants({ variant: 'outline' }),
            'w-full sm:w-auto sm:self-start'
          )}
        >
          {t('backToSpaces')}
        </Link>
      </div>
    );
  }

  if (!hasNavPermission(space.permissions, permission)) {
    const homeHref = slug ? `${ROUTES.space}/${slug}` : ROUTES.dashboard;
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            {t('forbiddenTitle')}
          </h1>
          <p className="mt-3 text-muted-foreground">{t('forbiddenDescription')}</p>
        </div>
        <Link
          href={homeHref}
          className={cn(
            buttonVariants({ variant: 'outline' }),
            'w-full sm:w-auto sm:self-start'
          )}
        >
          {t('backToHome')}
        </Link>
      </div>
    );
  }

  return children;
}
