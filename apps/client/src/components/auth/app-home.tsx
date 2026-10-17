'use client';

import { useTranslations } from 'next-intl';
import { LogoLoader } from '@/components/brand/logo-loader';
import { Button } from '@/components/ui/button';
import { LocaleSwitcher } from '@/components/i18n/locale-switcher';
import { useMe } from '@/hooks/use-me';
import { useRequireAuth } from '@/hooks/use-require-auth';

export function AppHome() {
  const t = useTranslations('Auth.appShell');
  const tCommon = useTranslations('Common');
  const { user: sessionUser, isPending, isSignedIn, isSigningOut, signOut } =
    useRequireAuth();
  const { data: me, isPending: mePending, isError } = useMe();

  if (isPending || !isSignedIn || !sessionUser) {
    return (
      <div className="flex justify-center py-12">
        <LogoLoader size="lg" showLabel label={t('checkingSession')} />
      </div>
    );
  }

  const user = {
    name: me?.name ?? sessionUser.name,
    email: me?.email ?? sessionUser.email,
    locale: me?.locale,
    emailVerified: me?.emailVerified ?? sessionUser.emailVerified,
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {t('title')}
          </h1>
          <p className="mt-3 text-muted-foreground">{t('description')}</p>
        </div>
        <LocaleSwitcher />
      </div>

      <dl className="grid gap-3 rounded-xl border border-border/80 bg-background/90 p-5 text-sm">
        <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
          <dt className="text-muted-foreground">{t('name')}</dt>
          <dd className="font-medium text-foreground">{user.name}</dd>
        </div>
        <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
          <dt className="text-muted-foreground">{t('email')}</dt>
          <dd className="font-medium text-foreground">{user.email}</dd>
        </div>
        <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
          <dt className="text-muted-foreground">{t('locale')}</dt>
          <dd className="font-medium text-foreground">
            {mePending
              ? tCommon('loading')
              : isError
                ? tCommon('unavailable')
                : user.locale}
          </dd>
        </div>
        <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
          <dt className="text-muted-foreground">{t('emailVerified')}</dt>
          <dd className="font-medium text-foreground">
            {user.emailVerified ? t('yes') : t('no')}
          </dd>
        </div>
      </dl>

      <Button
        type="button"
        variant="outline"
        className="w-full sm:w-auto sm:self-start"
        disabled={isSigningOut}
        onClick={() => {
          void signOut();
        }}
      >
        {isSigningOut ? tCommon('signingOut') : t('signOut')}
      </Button>
    </div>
  );
}
