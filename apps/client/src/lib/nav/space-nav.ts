import { PERMISSIONS, type Permission } from '@work-hub/constants';
import { ROUTES } from '@/lib/routes';

export type SpaceNavSection = 'main' | 'manage';

export type SpaceNavStatus = 'ready' | 'soon';

export type SpaceNavIcon =
  | 'home'
  | 'palmtree'
  | 'calendar'
  | 'party'
  | 'file'
  | 'users'
  | 'checks'
  | 'mail'
  | 'shield'
  | 'network'
  | 'sliders'
  | 'settings';

export type SpaceNavItem = {
  id: string;
  href: (slug: string) => string;
  icon: SpaceNavIcon;
  labelKey: string;
  section: SpaceNavSection;
  status: SpaceNavStatus;
  /** One permission, or any-of when an array. Omitted = every member. */
  permission?: Permission | readonly Permission[];
};

/**
 * Workspace sidebar items (WH-053).
 * `soon` items link to real placeholder routes until their feature ships.
 */
export const SPACE_NAV_ITEMS: readonly SpaceNavItem[] = [
  {
    id: 'home',
    href: (slug) => `${ROUTES.space}/${slug}`,
    icon: 'home',
    labelKey: 'home',
    section: 'main',
    status: 'ready',
  },
  {
    id: 'leave',
    href: (slug) => `${ROUTES.space}/${slug}/leave`,
    icon: 'palmtree',
    labelKey: 'leave',
    section: 'main',
    status: 'soon',
    permission: PERMISSIONS.REQUESTS_CREATE,
  },
  {
    id: 'calendar',
    href: (slug) => `${ROUTES.space}/${slug}/calendar`,
    icon: 'calendar',
    labelKey: 'calendar',
    section: 'main',
    status: 'soon',
    permission: PERMISSIONS.CALENDAR_READ,
  },
  {
    id: 'holidays',
    href: (slug) => `${ROUTES.space}/${slug}/holidays`,
    icon: 'party',
    labelKey: 'holidays',
    section: 'main',
    status: 'soon',
  },
  {
    id: 'documents',
    href: (slug) => `${ROUTES.space}/${slug}/documents`,
    icon: 'file',
    labelKey: 'documents',
    section: 'main',
    status: 'soon',
    permission: PERMISSIONS.REQUESTS_CREATE,
  },
  {
    id: 'team',
    href: (slug) => `${ROUTES.space}/${slug}/team`,
    icon: 'users',
    labelKey: 'team',
    section: 'main',
    status: 'ready',
    permission: PERMISSIONS.MEMBERS_READ,
  },
  {
    id: 'approvals',
    href: (slug) => `${ROUTES.space}/${slug}/approvals`,
    icon: 'checks',
    labelKey: 'approvals',
    section: 'manage',
    status: 'soon',
    permission: [PERMISSIONS.LEAVE_APPROVE, PERMISSIONS.DOCUMENTS_FULFIL],
  },
  {
    id: 'roles',
    href: (slug) => `${ROUTES.space}/${slug}/roles`,
    icon: 'shield',
    labelKey: 'roles',
    section: 'manage',
    status: 'soon',
    permission: PERMISSIONS.ROLES_WRITE,
  },
  {
    id: 'leavePolicies',
    href: (slug) => `${ROUTES.space}/${slug}/leave-policies`,
    icon: 'sliders',
    labelKey: 'leavePolicies',
    section: 'manage',
    status: 'soon',
    permission: [PERMISSIONS.LEAVE_TYPES_WRITE, PERMISSIONS.BALANCES_ADJUST],
  },
  {
    id: 'settings',
    href: (slug) => `${ROUTES.space}/${slug}/settings`,
    icon: 'settings',
    labelKey: 'settings',
    section: 'manage',
    status: 'ready',
    permission: PERMISSIONS.SPACE_SETTINGS_WRITE,
  },
] as const;

export function hasNavPermission(
  permissions: readonly string[],
  required?: Permission | readonly Permission[]
): boolean {
  if (!required) {
    return true;
  }
  const set = new Set(permissions);
  if (typeof required === 'string') {
    return set.has(required);
  }
  return required.some((p) => set.has(p));
}

/** Filter nav items by the caller's permissions (UX only; API still enforces). */
export function filterSpaceNav(
  items: readonly SpaceNavItem[],
  permissions: readonly string[]
): SpaceNavItem[] {
  return items.filter((item) => hasNavPermission(permissions, item.permission));
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
