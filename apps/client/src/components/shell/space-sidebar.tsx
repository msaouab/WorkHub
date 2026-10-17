'use client';

import {
  ChevronsLeftIcon,
  ChevronsRightIcon,
  HomeIcon,
  SettingsIcon,
  UsersIcon,
  type LucideIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { usePathname } from '@/i18n/navigation';
import { WorkspaceSwitcher } from '@/components/spaces/workspace-switcher';
import { SidebarItem } from '@/components/shell/sidebar-item';
import { buttonVariants } from '@/components/ui/button-variants';
import { useRoleLabel } from '@/hooks/use-role-label';
import {
  SPACE_NAV_ITEMS,
  activeSpaceNavId,
  filterSpaceNav,
} from '@/lib/nav/space-nav';
import { setSidebarCollapsedCookie } from '@/lib/sidebar-cookie';
import { cn } from '@/lib/utils';
import type { MeSpace } from '@work-hub/contracts';

const ICONS = {
  home: HomeIcon,
  users: UsersIcon,
  settings: SettingsIcon,
} satisfies Record<'home' | 'users' | 'settings', LucideIcon>;

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
  const roleLabel = useRoleLabel(space.roleName);
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
        'flex h-full flex-col border-e border-border/80 bg-background',
        collapsed ? 'w-15' : 'w-60',
        className
      )}
    >
      <div className={cn('border-b border-border/60 p-3', collapsed && 'px-2')}>
        {collapsed ? (
          <div className="flex justify-center py-1">
            <WorkspaceSwitcher compact />
          </div>
        ) : (
          <WorkspaceSwitcher />
        )}
        {!collapsed ? (
          <p className="mt-2 truncate px-1 text-xs text-muted-foreground">
            {t('role', { role: roleLabel })}
          </p>
        ) : null}
      </div>

      <nav
        aria-label={tShell('workspaceNav')}
        className="flex flex-1 flex-col gap-4 overflow-y-auto p-2"
      >
        <div className="flex flex-col gap-0.5">
          {main.map((item) => (
            <SidebarItem
              key={item.id}
              href={item.href(space.slug)}
              label={t(item.labelKey as 'home')}
              icon={ICONS[item.icon]}
              active={activeId === item.id}
              collapsed={collapsed}
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
                label={t(item.labelKey as 'members')}
                icon={ICONS[item.icon]}
                active={activeId === item.id}
                collapsed={collapsed}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        ) : null}
      </nav>

      <div className="hidden border-t border-border/60 p-2 lg:block">
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
