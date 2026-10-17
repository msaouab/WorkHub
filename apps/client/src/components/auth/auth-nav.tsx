'use client';

import { useTranslations } from 'next-intl';
import { UserMenu } from '@/components/account/user-menu';
import { buttonVariants } from '@/components/ui/button-variants';
import { useAuth } from '@/hooks/use-auth';
import { Link } from '@/i18n/navigation';
import { ROUTES } from '@/lib/routes';
import { cn } from '@/lib/utils';

type AuthNavProps = {
  tone?: 'default' | 'inverse';
};

export function AuthNav({ tone = 'default' }: AuthNavProps) {
  const t = useTranslations('Site.nav');
  const { user, isPending } = useAuth();
  const inverse = tone === 'inverse';

  if (isPending) {
    return (
      <div
        className="size-7 animate-pulse rounded-full bg-muted/50"
        aria-hidden
      />
    );
  }

  if (user) {
    return <UserMenu tone={tone} />;
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href={ROUTES.signIn}
        className={cn(
          buttonVariants({ variant: 'ghost' }),
          inverse && 'text-white/85 hover:bg-white/10 hover:text-white'
        )}
      >
        {t('signIn')}
      </Link>
      <Link
        href={ROUTES.signUp}
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
