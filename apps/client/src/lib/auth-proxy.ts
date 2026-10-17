import { DEFAULT_LOCALE, type Locale } from '@work-hub/constants';
import { isAppLocale } from '@/i18n/locale';
import { ROUTES } from '@/lib/routes';

export type AuthGateKind = 'guest-only' | 'protected' | 'public';

export type LocalizedPath = {
  locale: Locale;
  /** Path segments after the locale (e.g. `['sign-in']`). */
  segments: string[];
  kind: AuthGateKind;
};

const GUEST_ONLY = new Set<string>([
  ROUTES.signIn.slice(1),
  ROUTES.signUp.slice(1),
  ROUTES.forgotPassword.slice(1),
]);

const PROTECTED_ROOTS = new Set<string>([
  ROUTES.dashboard.slice(1),
  ROUTES.settings.slice(1),
  ROUTES.spaces.slice(1),
  ROUTES.space.slice(1), // /s/{slug}
]);

/** Parse `/{locale}/…` and classify the route for auth gating. */
export function parseLocalizedPath(pathname: string): LocalizedPath | null {
  const parts = pathname.split('/').filter(Boolean);
  const localePart = parts[0];
  if (!localePart || !isAppLocale(localePart)) {
    return null;
  }

  const segments = parts.slice(1);
  const root = segments[0];
  let kind: AuthGateKind = 'public';
  if (root && GUEST_ONLY.has(root) && segments.length === 1) {
    kind = 'guest-only';
  } else if (root === 's') {
    // `/s` alone is not a workspace — let the catch-all 404 (WH-051).
    // `/s/{slug}/…` stays protected.
    if (segments.length >= 2) {
      kind = 'protected';
    }
  } else if (root && PROTECTED_ROOTS.has(root)) {
    kind = 'protected';
  }

  return { locale: localePart, segments, kind };
}

export type AuthRedirectInput = {
  pathname: string;
  /** True only when get-session returned a real user. */
  signedIn: boolean;
  /** `session.user.locale` when signed in. */
  userLocale?: string | null;
};

/**
 * Where the proxy should send the request, or `null` to continue to next-intl.
 * Prefer the user's saved language when redirecting a signed-in user off auth pages.
 */
export function authRedirectPath(input: AuthRedirectInput): string | null {
  const parsed = parseLocalizedPath(input.pathname);
  if (!parsed) {
    return null;
  }

  const urlLocale = parsed.locale;
  const preferredLocale =
    input.userLocale && isAppLocale(input.userLocale)
      ? input.userLocale
      : urlLocale;

  if (parsed.kind === 'guest-only' && input.signedIn) {
    // land=1: send them to their last workspace once (WH-052), not every /dashboard visit.
    return `/${preferredLocale}${ROUTES.dashboard}?land=1`;
  }

  if (parsed.kind === 'protected' && !input.signedIn) {
    return `/${urlLocale}${ROUTES.signIn}`;
  }

  return null;
}

/** Locale to use when building absolute callback URLs. */
export function callbackLocale(urlLocale: string): Locale {
  return isAppLocale(urlLocale) ? urlLocale : DEFAULT_LOCALE;
}
