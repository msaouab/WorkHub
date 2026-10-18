'use client';

import { useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { PageLoader } from '@/components/brand/logo-loader';
import { AppFrame, AppMain } from '@/components/shell/app-frame';
import { MobileNavDrawer } from '@/components/shell/mobile-nav-drawer';
import { SpaceSidebar } from '@/components/shell/space-sidebar';
import { buttonVariants } from '@/components/ui/button-variants';
import { useCurrentSpace } from '@/hooks/use-space';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { Link } from '@/i18n/navigation';
import { ROUTES } from '@/lib/routes';
import { cn } from '@/lib/utils';

type SpaceShellProps = {
  children: ReactNode;
  /** From server cookie so first paint has the right width. */
  initialCollapsed: boolean;
};

/**
 * Workspace chrome (WH-052): sidebar when the user has access;
 * access/paused errors render without the sidebar.
 */
export function SpaceShell({ children, initialCollapsed }: SpaceShellProps) {
  const t = useTranslations('Spaces.home');
  const tShell = useTranslations('Shell');
  const { isPending: authPending, isSignedIn } = useRequireAuth();
  const { slug, space, isPending, isError, isForbidden } = useCurrentSpace();
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (authPending || !isSignedIn || isPending) {
    return (
      <AppFrame>
        <AppMain>
          <PageLoader fill="parent" label={t('loading')} />
        </AppMain>
      </AppFrame>
    );
  }

  if (isError) {
    return (
      <AppFrame>
        <AppMain>
          <p className="text-sm text-destructive" role="alert">
            {t('failed')}
          </p>
        </AppMain>
      </AppFrame>
    );
  }

  if (isForbidden || !space) {
    return (
      <AppFrame>
        <AppMain>
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
        </AppMain>
      </AppFrame>
    );
  }

  if (space.membershipStatus === 'deactivated') {
    return (
      <AppFrame>
        <AppMain>
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="font-display text-3xl font-semibold tracking-tight">
                {t('pausedTitle')}
              </h1>
              <p className="mt-3 text-muted-foreground">
                {t('pausedDescription', { name: space.name })}
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
        </AppMain>
      </AppFrame>
    );
  }

  return (
    <AppFrame
      breadcrumb={space.name}
      searchWorkspaceName={space.name}
      onOpenMobileNav={() => setDrawerOpen(true)}
    >
      <div className="hidden min-h-0 shrink-0 lg:flex">
        <SpaceSidebar
          space={space}
          collapsed={collapsed}
          onCollapsedChange={setCollapsed}
        />
      </div>
      <MobileNavDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={tShell('workspaceNav')}
      >
        <SpaceSidebar
          space={space}
          collapsed={false}
          onCollapsedChange={() => undefined}
          onNavigate={() => setDrawerOpen(false)}
          className="w-full border-e-0"
        />
      </MobileNavDrawer>
      <AppMain wide>{children}</AppMain>
    </AppFrame>
  );
}
