'use client';

import { useTranslations } from 'next-intl';
import { UserAvatar } from '@/components/account/user-avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from '@/i18n/navigation';
import { ROUTES } from '@/lib/routes';
import { cn } from '@/lib/utils';

type UserMenuProps = {
  tone?: 'default' | 'inverse';
};

export function UserMenu({ tone = 'default' }: UserMenuProps) {
  const t = useTranslations('Account.menu');
  const { user, isSigningOut, signOut } = useAuth();
  const router = useRouter();
  const inverse = tone === 'inverse';

  if (!user) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t('open', { name: user.name })}
        className={cn(
          'inline-flex size-7 items-center justify-center rounded-full outline-none',
          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          inverse &&
            'ring-offset-transparent focus-visible:ring-white/80 focus-visible:ring-offset-0'
        )}
      >
        <UserAvatar
          name={user.name}
          userId={user.id}
          image={user.image}
          size="sm"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56 max-w-[min(18rem,calc(100vw-2rem))]">
        <div className="flex items-center gap-3 px-1.5 py-2">
          <UserAvatar
            name={user.name}
            userId={user.id}
            image={user.image}
            size="lg"
          />
          <div className="min-w-0 flex-1">
            <p
              className="truncate text-sm font-medium text-foreground"
              title={user.name}
            >
              {user.name}
            </p>
            <p
              className="truncate text-xs text-muted-foreground"
              title={user.email}
              dir="ltr"
            >
              {user.email}
            </p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            router.push(ROUTES.settings);
          }}
        >
          {t('settings')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={isSigningOut}
          onClick={() => {
            void signOut();
          }}
        >
          {isSigningOut ? t('signingOut') : t('signOut')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
