import { ROUTES } from '@/lib/routes';

export type SettingsNavItem = {
  id: string;
  href: string;
  labelKey: string;
};

export const SETTINGS_NAV_ITEMS: readonly SettingsNavItem[] = [
  { id: 'profile', href: ROUTES.settings, labelKey: 'profile' },
  {
    id: 'language',
    href: `${ROUTES.settings}/language`,
    labelKey: 'language',
  },
  {
    id: 'password',
    href: `${ROUTES.settings}/password`,
    labelKey: 'password',
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
