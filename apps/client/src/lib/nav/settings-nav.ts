import { ROUTES } from '@/lib/routes';

export type SettingsNavStatus = 'ready' | 'soon';

export type SettingsNavItem = {
  id: string;
  href: string;
  labelKey: string;
  status: SettingsNavStatus;
  /** Render the label in a danger style (delete account). */
  danger?: boolean;
};

export const SETTINGS_NAV_ITEMS: readonly SettingsNavItem[] = [
  {
    id: 'profile',
    href: ROUTES.settings,
    labelKey: 'profile',
    status: 'ready',
  },
  {
    id: 'language',
    href: `${ROUTES.settings}/language`,
    labelKey: 'language',
    status: 'ready',
  },
  {
    id: 'password',
    href: `${ROUTES.settings}/password`,
    labelKey: 'password',
    status: 'ready',
  },
  {
    id: 'signInMethods',
    href: `${ROUTES.settings}/sign-in-methods`,
    labelKey: 'signInMethods',
    status: 'soon',
  },
  {
    id: 'sessions',
    href: `${ROUTES.settings}/sessions`,
    labelKey: 'sessions',
    status: 'soon',
  },
  {
    id: 'notifications',
    href: `${ROUTES.settings}/notifications`,
    labelKey: 'notifications',
    status: 'soon',
  },
  {
    id: 'deleteAccount',
    href: `${ROUTES.settings}/delete-account`,
    labelKey: 'deleteAccount',
    status: 'soon',
    danger: true,
  },
] as const;

export function activeSettingsNavId(
  items: readonly SettingsNavItem[],
  pathname: string
): string | null {
  let best: { id: string; len: number } | null = null;
  for (const item of items) {
    if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
      // Prefer longer paths so /settings/language wins over /settings.
      if (
        item.href === ROUTES.settings &&
        pathname !== ROUTES.settings &&
        pathname !== `${ROUTES.settings}/`
      ) {
        continue;
      }
      if (!best || item.href.length > best.len) {
        best = { id: item.id, len: item.href.length };
      }
    }
  }
  return best?.id ?? null;
}
