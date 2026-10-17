'use client';

import { useTranslations } from 'next-intl';
import { ChevronsUpDownIcon, PlusIcon } from 'lucide-react';
import { useSpaces } from '@/hooks/use-spaces';
import { usePathname, useRouter } from '@/i18n/navigation';
import { setLastSpaceSlug } from '@/lib/last-space';
import { ROUTES } from '@/lib/routes';
import { buttonVariants } from '@/components/ui/button-variants';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SpaceLogo } from '@/components/spaces/space-logo';
import { cn } from '@/lib/utils';

type WorkspaceSwitcherProps = {
  /** Icon-only trigger for a collapsed sidebar. */
  compact?: boolean;
};

export function WorkspaceSwitcher({ compact = false }: WorkspaceSwitcherProps) {
  const t = useTranslations('Spaces.switcher');
  const { data: spaces, isPending } = useSpaces();
  const pathname = usePathname();
  const router = useRouter();
  const activeSlug = pathname.startsWith(`${ROUTES.space}/`)
    ? pathname.split('/')[2]
    : undefined;
  const active = spaces?.find((s) => s.slug === activeSlug);

  const label = isPending
    ? t('loading')
    : active
      ? active.name
      : t('pick');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: 'outline', size: 'sm' }),
          compact ? 'size-9 justify-center px-0' : 'max-w-48 gap-1.5'
        )}
        aria-label={t('pick')}
      >
        {active ? (
          <SpaceLogo
            name={active.name}
            spaceId={active.id}
            logo={active.logo}
            size="sm"
          />
        ) : null}
        {compact ? (
          <span className="sr-only">{label}</span>
        ) : (
          <>
            <span className="truncate">{label}</span>
            <ChevronsUpDownIcon className="size-3.5 shrink-0 opacity-60" />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-48">
        {(spaces ?? []).map((space) => (
          <DropdownMenuItem
            key={space.id}
            className={cn(
              'gap-2',
              space.slug === activeSlug && 'font-semibold'
            )}
            onClick={() => {
              setLastSpaceSlug(space.slug);
              router.push(`${ROUTES.space}/${space.slug}`);
            }}
          >
            <SpaceLogo
              name={space.name}
              spaceId={space.id}
              logo={space.logo}
              size="sm"
            />
            <span className="truncate">{space.name}</span>
            <span className="ms-auto text-xs text-muted-foreground">
              {space.roleName}
            </span>
          </DropdownMenuItem>
        ))}
        {spaces && spaces.length > 0 ? <DropdownMenuSeparator /> : null}
        <DropdownMenuItem
          className="gap-2"
          onClick={() => router.push(ROUTES.spacesNew)}
        >
          <PlusIcon className="size-3.5" />
          {t('create')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push(ROUTES.spaces)}>
          {t('all')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push(ROUTES.dashboard)}>
          {t('dashboard')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
