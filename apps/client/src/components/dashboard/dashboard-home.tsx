'use client';

import type { CSSProperties } from 'react';
import type { MeSpace } from '@work-hub/contracts';
import { useTranslations } from 'next-intl';
import { COVER_PRESET_STYLES } from '@/lib/cover-presets';
import { LogoLoader } from '@/components/brand/logo-loader';
import { PostAuthRedirect } from '@/components/dashboard/post-auth-redirect';
import { SpaceLogo } from '@/components/spaces/space-logo';
import { buttonVariants } from '@/components/ui/button-variants';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { useSpaces } from '@/hooks/use-spaces';
import { Link } from '@/i18n/navigation';
import { setLastSpaceSlug } from '@/lib/last-space';
import { ROUTES } from '@/lib/routes';
import { cn } from '@/lib/utils';

/**
 * "You across workspaces" hub (WH-052). Stays on /dashboard unless ?land=1
 * (right after sign-in / proxy guest redirect).
 */
export function DashboardHome() {
  const t = useTranslations('Dashboard');
  const tAuth = useTranslations('Auth.appShell');
  const { isPending: authPending, isSignedIn } = useRequireAuth();
  const { data: spaces, isPending, isError } = useSpaces();

  if (authPending || !isSignedIn || isPending) {
    return (
      <div className="flex justify-center py-12">
        <LogoLoader size="lg" showLabel label={tAuth('checkingSession')} />
        <PostAuthRedirect />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <PostAuthRedirect />
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {t('title')}
        </h1>
        <p className="mt-2 text-muted-foreground">{t('description')}</p>
      </div>

      {isError ? (
        <p className="text-sm text-destructive" role="alert">
          {t('failed')}
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {(spaces ?? []).map((space) => (
            <li key={space.id}>
              <Link
                href={`${ROUTES.space}/${space.slug}`}
                onClick={() => setLastSpaceSlug(space.slug)}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-background/90 transition-colors hover:border-foreground/25"
              >
                <div
                  className="h-24 w-full bg-muted"
                  style={coverStyle(space)}
                  aria-hidden
                />
                <div className="flex items-center gap-3 px-4 py-3">
                  <SpaceLogo
                    name={space.name}
                    spaceId={space.id}
                    logo={space.logo}
                    size="md"
                    className="-mt-8 ring-2 ring-background"
                  />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {space.name}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {space.roleName}
                    </p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
          <li>
            <Link
              href={ROUTES.spacesNew}
              className={cn(
                'flex h-full min-h-36 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border/80 px-4 py-8 text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:bg-accent/30 hover:text-foreground'
              )}
            >
              <span className="text-2xl font-light" aria-hidden>
                +
              </span>
              {t('create')}
            </Link>
          </li>
        </ul>
      )}

      {(spaces?.length ?? 0) > 0 ? (
        <Link
          href={ROUTES.spaces}
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'self-start')}
        >
          {t('allSpaces')}
        </Link>
      ) : null}
    </div>
  );
}

function coverStyle(space: MeSpace): CSSProperties {
  if (space.cover?.kind === 'image') {
    return {
      backgroundImage: `url(${space.cover.url1600})`,
      backgroundSize: 'cover',
      backgroundPosition: `center ${space.coverPositionY}%`,
    };
  }
  if (space.cover?.kind === 'preset') {
    return { background: COVER_PRESET_STYLES[space.cover.preset] };
  }
  return {};
}
