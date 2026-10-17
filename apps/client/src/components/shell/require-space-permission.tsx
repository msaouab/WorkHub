'use client';

import type { Permission } from '@work-hub/constants';
import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { LogoLoader } from '@/components/brand/logo-loader';
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
 * Missing access shows the same "no access" state as an unknown slug — not a fake coming-soon.
 */
export function RequireSpacePermission({
  permission,
  children,
}: RequireSpacePermissionProps) {
  const t = useTranslations('Spaces.home');
  const { slug, space, isPending, isError, isForbidden } = useCurrentSpace();

  if (isPending) {
    return (
      <div className="flex justify-center py-12">
        <LogoLoader size="lg" showLabel label={t('loading')} />
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive" role="alert">
        {t('failed')}
      </p>
    );
  }

  const denied =
    isForbidden ||
    !space ||
    !hasNavPermission(space.permissions, permission);

  if (denied) {
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

  return children;
}
