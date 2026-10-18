'use client';

import type { CSSProperties } from 'react';
import type { MeSpace } from '@work-hub/contracts';
import { useTranslations } from 'next-intl';
import { COVER_PRESET_STYLES } from '@/lib/cover-presets';
import { PageLoader } from '@/components/brand/logo-loader';
import { PostAuthRedirect } from '@/components/dashboard/post-auth-redirect';
import { PageHeader } from '@/components/shell/page-header';
import { SpaceLogo } from '@/components/spaces/space-logo';
import { buttonVariants } from '@/components/ui/button-variants';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { useRoleLabel } from '@/hooks/use-role-label';
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
  const tShell = useTranslations('Shell');
  const tAuth = useTranslations('Auth.appShell');
  const { isPending: authPending, isSignedIn } = useRequireAuth();
  const { data: spaces, isPending, isError } = useSpaces();

  if (authPending || !isSignedIn || isPending) {
    return (
      <>
        <PageLoader fill="parent" label={tAuth('checkingSession')} />
        <PostAuthRedirect />
      </>
    );
  }

  return (
    <div className="flex min-h-full flex-col gap-10">
      <PostAuthRedirect />
      <div className="flex flex-col gap-10">
        <PageHeader title={t('title')} description={t('description')} />

        {isError ? (
          <p className="text-sm text-destructive" role="alert">
            {t('failed')}
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {(spaces ?? []).map((space) => (
              <li key={space.id}>
                <SpaceCard space={space} />
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
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'self-start'
            )}
          >
            {t('allSpaces')}
          </Link>
        ) : null}
      </div>

      <footer className="mt-auto border-t border-border/60 pt-6">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">
            {t('requestsTitle')}
          </h2>
          <span className="rounded-md bg-muted px-1.5 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
            {tShell('soon')}
          </span>
        </div>
        <p className="mt-1.5 max-w-lg text-sm text-muted-foreground">
          {t('requestsDescription')}
        </p>
      </footer>
    </div>
  );
}

function SpaceCard({ space }: { space: MeSpace }) {
  const roleLabel = useRoleLabel(space.roleName);
  return (
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
          <p className="truncate font-medium text-foreground">{space.name}</p>
          <p className="truncate text-sm text-muted-foreground">{roleLabel}</p>
        </div>
      </div>
    </Link>
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
