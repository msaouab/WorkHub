import { PERMISSIONS, type Permission } from '@work-hub/constants';
import { ROUTES } from '@/lib/routes';

export type SpaceNavSection = 'main' | 'manage';

export type SpaceNavItem = {
  id: string;
  href: (slug: string) => string;
  /** Lucide icon name key consumed by the sidebar. */
  icon: 'home' | 'users' | 'settings';
  labelKey: string;
  section: SpaceNavSection;
  permission?: Permission;
};

/**
 * Workspace sidebar items (WH-052).
 * Only pages that exist are listed; WH-046 will add Members.
 */
export const SPACE_NAV_ITEMS: readonly SpaceNavItem[] = [
  {
    id: 'home',
    href: (slug) => `${ROUTES.space}/${slug}`,
    icon: 'home',
    labelKey: 'home',
    section: 'main',
  },
  // Members (WH-046) — keep the route/stub, but don't list a stub in the sidebar.
  {
    id: 'settings',
    href: (slug) => `${ROUTES.space}/${slug}/settings`,
    icon: 'settings',
    labelKey: 'settings',
    section: 'manage',
    permission: PERMISSIONS.SPACE_SETTINGS_WRITE,
  },
] as const;

/** Filter nav items by the caller's permissions (UX only; API still enforces). */
export function filterSpaceNav(
  items: readonly SpaceNavItem[],
  permissions: readonly string[]
): SpaceNavItem[] {
  const set = new Set(permissions);
  return items.filter(
    (item) => !item.permission || set.has(item.permission)
  );
}

/**
 * Active item: longest matching href wins
 * (so `/s/acme/settings` doesn't highlight Home).
 * Home matches only the exact workspace root.
 */
export function activeSpaceNavId(
  items: readonly SpaceNavItem[],
  slug: string,
  pathname: string
): string | null {
  const path = pathname.replace(/\/$/, '') || pathname;
  let best: { id: string; len: number } | null = null;
  for (const item of items) {
    const href = item.href(slug).replace(/\/$/, '');
    const matches =
      item.id === 'home'
        ? path === href
        : path === href || path.startsWith(`${href}/`);
    if (matches && (!best || href.length > best.len)) {
      best = { id: item.id, len: href.length };
    }
  }
  return best?.id ?? null;
}
