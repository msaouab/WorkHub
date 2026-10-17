'use client';

import type { MeSpace } from '@work-hub/contracts';
import { ChevronsUpDownIcon, LayoutDashboardIcon, PlusIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { SpaceLogo } from '@/components/spaces/space-logo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRoleLabel } from '@/hooks/use-role-label';
import { useSpaces } from '@/hooks/use-spaces';
import { usePathname, useRouter } from '@/i18n/navigation';
import { setLastSpaceSlug } from '@/lib/last-space';
import { ROUTES } from '@/lib/routes';
import { cn } from '@/lib/utils';

type WorkspaceSwitcherProps = {
  /** Icon-only trigger for a collapsed sidebar. */
  compact?: boolean;
  /** Current workspace — enables the full sidebar header (logo, name, role). */
  space?: MeSpace;
};

export function WorkspaceSwitcher({
  compact = false,
  space,
}: WorkspaceSwitcherProps) {
  const t = useTranslations('Spaces.switcher');
  const tHome = useTranslations('Spaces.home');
  const { data: spaces, isPending } = useSpaces();
  const pathname = usePathname();
  const router = useRouter();
  const activeSlug = pathname.startsWith(`${ROUTES.space}/`)
    ? pathname.split('/')[2]
    : space?.slug;
  const active =
    space ?? spaces?.find((s) => s.slug === activeSlug) ?? undefined;
  const roleLabel = useRoleLabel(active?.roleName ?? '');

  const label = isPending
    ? t('loading')
    : active
      ? active.name
      : t('pick');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t('pick')}
        className={cn(
          'outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
          compact &&
            'flex size-9 items-center justify-center rounded-xl hover:bg-accent/60',
          !compact &&
            space &&
            'flex w-full items-center gap-2.5 rounded-xl p-1.5 pe-2 text-start hover:bg-accent/60 data-popup-open:bg-accent/60',
          !compact &&
            !space &&
            'inline-flex max-w-48 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm font-medium hover:bg-muted'
        )}
      >
        {active ? (
          <SpaceLogo
            name={active.name}
            spaceId={active.id}
            logo={active.logo}
            size={space && !compact ? 'md' : 'sm'}
            className={space && !compact ? 'rounded-lg' : undefined}
          />
        ) : null}
        {compact ? (
          <span className="sr-only">{label}</span>
        ) : space && active ? (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-foreground">
                {active.name}
              </span>
              <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                {roleLabel}
              </span>
            </span>
            <ChevronsUpDownIcon
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
          </>
        ) : (
          <>
            <span className="truncate">{label}</span>
            <ChevronsUpDownIcon
              className="size-3.5 shrink-0 opacity-60"
              aria-hidden
            />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className={cn('min-w-56', space && 'w-(--anchor-width)')}
      >
        {(spaces ?? []).map((row) => {
          const rowRole = SYSTEM_ROLE_KEYS.has(row.roleName)
            ? tHome(`roles.${row.roleName}` as 'roles.Owner')
            : row.roleName;
          return (
            <DropdownMenuItem
              key={row.id}
              className={cn(
                'gap-2',
                row.slug === activeSlug && 'bg-accent text-accent-foreground'
              )}
              onClick={() => {
                setLastSpaceSlug(row.slug);
                router.push(`${ROUTES.space}/${row.slug}`);
              }}
            >
              <SpaceLogo
                name={row.name}
                spaceId={row.id}
                logo={row.logo}
                size="sm"
              />
              <span className="min-w-0 flex-1 truncate font-medium">
                {row.name}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {rowRole}
              </span>
            </DropdownMenuItem>
          );
        })}
        {spaces && spaces.length > 0 ? <DropdownMenuSeparator /> : null}
        <DropdownMenuItem
          className="gap-2"
          onClick={() => router.push(ROUTES.dashboard)}
        >
          <LayoutDashboardIcon className="size-3.5" aria-hidden />
          {t('all')}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="gap-2"
          onClick={() => router.push(ROUTES.spacesNew)}
        >
          <PlusIcon className="size-3.5" aria-hidden />
          {t('create')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const SYSTEM_ROLE_KEYS = new Set(['Owner', 'Admin', 'Member']);
