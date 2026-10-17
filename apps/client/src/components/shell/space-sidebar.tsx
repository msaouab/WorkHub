'use client';

import {
  ChevronsLeftIcon,
  ChevronsRightIcon,
  LifeBuoyIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { WorkspaceSwitcher } from '@/components/spaces/workspace-switcher';
import { SidebarItem } from '@/components/shell/sidebar-item';
import { buttonVariants } from '@/components/ui/button-variants';
import {
  SPACE_NAV_ITEMS,
  activeSpaceNavId,
  filterSpaceNav,
} from '@/lib/nav/space-nav';
import { SPACE_NAV_ICONS } from '@/lib/nav/space-nav-icons';
import { setSidebarCollapsedCookie } from '@/lib/sidebar-cookie';
import { ROUTES } from '@/lib/routes';
import { cn } from '@/lib/utils';
import type { MeSpace } from '@work-hub/contracts';

type SpaceSidebarProps = {
  space: MeSpace;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  onNavigate?: () => void;
  className?: string;
};

export function SpaceSidebar({
  space,
  collapsed,
  onCollapsedChange,
  onNavigate,
  className,
}: SpaceSidebarProps) {
  const t = useTranslations('Shell.spaceNav');
  const tShell = useTranslations('Shell');
  const pathname = usePathname();
  const items = filterSpaceNav(SPACE_NAV_ITEMS, space.permissions);
  const activeId = activeSpaceNavId(items, space.slug, pathname);
  const main = items.filter((i) => i.section === 'main');
  const manage = items.filter((i) => i.section === 'manage');

  function toggleCollapse() {
    const next = !collapsed;
    setSidebarCollapsedCookie(next);
    onCollapsedChange(next);
  }

  return (
    <aside
      className={cn(
        'flex h-full min-h-0 flex-col overflow-hidden border-e border-border/80 bg-background',
        collapsed ? 'w-15' : 'w-60',
        className
      )}
    >
      <div
        className={cn(
          'shrink-0 border-b border-border/60 p-2',
          collapsed && 'flex justify-center px-2 py-2.5'
        )}
      >
        {collapsed ? (
          <WorkspaceSwitcher compact space={space} />
        ) : (
          <WorkspaceSwitcher space={space} />
        )}
      </div>

      <nav
        aria-label={tShell('workspaceNav')}
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain p-2"
      >
        <div className="flex flex-col gap-0.5">
          {main.map((item) => (
            <SidebarItem
              key={item.id}
              href={item.href(space.slug)}
              label={t(item.labelKey as 'home')}
              icon={SPACE_NAV_ICONS[item.icon]}
              active={activeId === item.id}
              collapsed={collapsed}
              soon={item.status === 'soon'}
              onNavigate={onNavigate}
            />
          ))}
        </div>
        {manage.length > 0 ? (
          <div className="flex flex-col gap-0.5">
            {!collapsed ? (
              <p className="px-2.5 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('manage')}
              </p>
            ) : null}
            {manage.map((item) => (
              <SidebarItem
                key={item.id}
                href={item.href(space.slug)}
                label={t(item.labelKey as 'settings')}
                icon={SPACE_NAV_ICONS[item.icon]}
                active={activeId === item.id}
                collapsed={collapsed}
                soon={item.status === 'soon'}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        ) : null}
      </nav>

      <div className="hidden shrink-0 border-t border-border/60 p-2 lg:flex lg:flex-col lg:gap-0.5">
        <Link
          href={ROUTES.contact}
          onClick={onNavigate}
          title={collapsed ? tShell('help') : undefined}
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'w-full justify-start gap-2',
            collapsed && 'justify-center px-0'
          )}
        >
          <LifeBuoyIcon className="size-4 shrink-0" aria-hidden />
          {collapsed ? (
            <span className="sr-only">{tShell('help')}</span>
          ) : (
            tShell('help')
          )}
        </Link>
        <button
          type="button"
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'w-full justify-start gap-2',
            collapsed && 'justify-center px-0'
          )}
          onClick={toggleCollapse}
          aria-expanded={!collapsed}
          title={collapsed ? tShell('expand') : tShell('collapse')}
        >
          {collapsed ? (
            <ChevronsRightIcon className="size-4 rtl:rotate-180" aria-hidden />
          ) : (
            <>
              <ChevronsLeftIcon className="size-4 rtl:rotate-180" aria-hidden />
              {tShell('collapse')}
            </>
          )}
          {collapsed ? (
            <span className="sr-only">{tShell('expand')}</span>
          ) : null}
        </button>
      </div>
    </aside>
  );
}
