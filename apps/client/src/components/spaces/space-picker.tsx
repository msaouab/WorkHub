'use client';

import { useTranslations } from 'next-intl';
import { LogoLoader } from '@/components/brand/logo-loader';
import { buttonVariants } from '@/components/ui/button-variants';
import { SpaceLogo } from '@/components/spaces/space-logo';
import { useSpaces } from '@/hooks/use-spaces';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { Link } from '@/i18n/navigation';
import { setLastSpaceSlug } from '@/lib/last-space';
import { ROUTES } from '@/lib/routes';
import { cn } from '@/lib/utils';

export function SpacePicker() {
  const t = useTranslations('Spaces.picker');
  const { isPending: authPending, isSignedIn } = useRequireAuth();
  const { data: spaces, isPending, isError } = useSpaces();

  if (authPending || !isSignedIn || isPending) {
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

  if (!spaces?.length) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            {t('emptyTitle')}
          </h1>
          <p className="mt-3 text-muted-foreground">{t('emptyDescription')}</p>
        </div>
        <Link
          href={ROUTES.spacesNew}
          className={cn(
            buttonVariants({ size: 'lg' }),
            'w-full sm:w-auto sm:self-start'
          )}
        >
          {t('create')}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {t('title')}
        </h1>
        <p className="mt-3 text-muted-foreground">{t('description')}</p>
      </div>

      <ul className="flex flex-col gap-2">
        {spaces.map((space) => (
          <li key={space.id}>
            <Link
              href={`${ROUTES.space}/${space.slug}`}
              onClick={() => setLastSpaceSlug(space.slug)}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/80 bg-background/90 px-4 py-3 text-sm transition-colors hover:border-foreground/20 hover:bg-accent/40"
            >
              <span className="flex min-w-0 items-center gap-3">
                <SpaceLogo
                  name={space.name}
                  spaceId={space.id}
                  logo={space.logo}
                  size="md"
                />
                <span className="truncate font-medium text-foreground">
                  {space.name}
                </span>
              </span>
              <span className="text-muted-foreground">{space.roleName}</span>
            </Link>
          </li>
        ))}
      </ul>

      <Link
        href={ROUTES.spacesNew}
        className={cn(
          buttonVariants({ variant: 'outline' }),
          'w-full sm:w-auto sm:self-start'
        )}
      >
        {t('create')}
      </Link>
    </div>
  );
}
