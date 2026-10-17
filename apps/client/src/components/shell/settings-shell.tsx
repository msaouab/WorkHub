'use client';

import { ArrowLeftIcon } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { LogoLoader } from '@/components/brand/logo-loader';
import { AppFrame, AppMain } from '@/components/shell/app-frame';
import { MobileNavDrawer } from '@/components/shell/mobile-nav-drawer';
import { SettingsNav } from '@/components/shell/settings-nav';
import { buttonVariants } from '@/components/ui/button-variants';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { Link } from '@/i18n/navigation';
import { ROUTES } from '@/lib/routes';
import { cn } from '@/lib/utils';

export function SettingsShell({ children }: { children: ReactNode }) {
  const t = useTranslations('Shell');
  const tNav = useTranslations('Shell.settingsNav');
  const tAuth = useTranslations('Auth.appShell');
  const { isPending, isSignedIn } = useRequireAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (isPending || !isSignedIn) {
    return (
      <AppFrame breadcrumb={t('accountSettings')}>
        <AppMain>
          <div className="flex justify-center py-12">
            <LogoLoader size="lg" showLabel label={tAuth('checkingSession')} />
          </div>
        </AppMain>
      </AppFrame>
    );
  }

  return (
    <AppFrame
      breadcrumb={t('accountSettings')}
      onOpenMobileNav={() => setDrawerOpen(true)}
    >
      <div className="hidden min-h-0 shrink-0 lg:flex">
        <SettingsNav />
      </div>
      <MobileNavDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={t('settingsNavLabel')}
      >
        <SettingsNav
          onNavigate={() => setDrawerOpen(false)}
          className="w-full border-e-0"
        />
      </MobileNavDrawer>
      <AppMain>
        <Link
          href={ROUTES.dashboard}
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            '-ms-2 mb-4 text-muted-foreground lg:hidden'
          )}
        >
          <ArrowLeftIcon
            data-icon="inline-start"
            className="rtl:rotate-180"
            aria-hidden
          />
          {tNav('backToDashboard')}
        </Link>
        {children}
      </AppMain>
    </AppFrame>
  );
}
