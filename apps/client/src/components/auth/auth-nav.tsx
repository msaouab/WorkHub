'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button-variants';
import { Link, useRouter } from '@/i18n/navigation';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';

type AuthNavProps = {
  tone?: 'default' | 'inverse';
};

export function AuthNav({ tone = 'default' }: AuthNavProps) {
  const t = useTranslations('Site.nav');
  const tCommon = useTranslations('Common');
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [signingOut, setSigningOut] = useState(false);
  const inverse = tone === 'inverse';

  async function onSignOut() {
    setSigningOut(true);
    await authClient.signOut();
    setSigningOut(false);
    router.replace('/');
    router.refresh();
  }

  if (isPending) {
    return <div className="h-9 w-24 animate-pulse rounded-lg bg-muted/40" aria-hidden />;
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/app"
          className={cn(
            buttonVariants({ variant: 'ghost' }),
            inverse && 'text-white/85 hover:bg-white/10 hover:text-white'
          )}
        >
          {tCommon('account')}
        </Link>
        <Button
          type="button"
          variant={inverse ? 'secondary' : 'outline'}
          size="sm"
          disabled={signingOut}
          onClick={onSignOut}
          className={cn(inverse && 'border-white/30 bg-white/10 text-white hover:bg-white/20')}
        >
          {signingOut ? tCommon('signingOut') : t('signOut')}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/sign-in"
        className={cn(
          buttonVariants({ variant: 'ghost' }),
          inverse && 'text-white/85 hover:bg-white/10 hover:text-white'
        )}
      >
        {t('signIn')}
      </Link>
      <Link
        href="/sign-up"
        className={cn(
          buttonVariants({ variant: 'default' }),
          inverse && 'bg-white text-primary hover:bg-white/90'
        )}
      >
        {t('signUp')}
      </Link>
    </div>
  );
}
