'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button-variants';
import { useAuth } from '@/hooks/use-auth';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

type AuthNavProps = {
  tone?: 'default' | 'inverse';
};

export function AuthNav({ tone = 'default' }: AuthNavProps) {
  const t = useTranslations('Site.nav');
  const tCommon = useTranslations('Common');
  const { user, isPending, isSigningOut, signOut } = useAuth();
  const inverse = tone === 'inverse';

  if (isPending) {
    return <div className="h-9 w-24 animate-pulse rounded-lg bg-muted/40" aria-hidden />;
  }

  if (user) {
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
          disabled={isSigningOut}
          onClick={() => {
            void signOut();
          }}
          className={cn(inverse && 'border-white/30 bg-white/10 text-white hover:bg-white/20')}
        >
          {isSigningOut ? tCommon('signingOut') : t('signOut')}
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
