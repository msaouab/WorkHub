import {
  DEFAULT_LOCALE,
  LOCALES,
  SIGNUP_LOCALE_HEADER,
  type Locale,
} from '@work-hub/constants';

export { SIGNUP_LOCALE_HEADER };

/** Returns a supported locale, or `en` when the value is missing / invalid. */
export function resolveSignupLocale(raw: string | null | undefined): Locale {
  if (!raw) {
    return DEFAULT_LOCALE;
  }
  const primary = raw.split(',')[0]?.trim().split('-')[0]?.toLowerCase();
  return (LOCALES as readonly string[]).includes(primary ?? '')
    ? (primary as Locale)
    : DEFAULT_LOCALE;
}

/**
 * Prefer our explicit header; fall back to Accept-Language (e.g. curl / other clients).
 */
export function localeFromRequestHeaders(
  headers: Headers | null | undefined
): Locale {
  if (!headers) {
    return DEFAULT_LOCALE;
  }
  return resolveSignupLocale(
    headers.get(SIGNUP_LOCALE_HEADER) ?? headers.get('accept-language')
  );
}
