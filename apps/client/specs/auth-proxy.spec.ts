import { describe, expect, it } from 'vitest';
import { authRedirectPath, parseLocalizedPath } from '../src/lib/auth-proxy';

describe('parseLocalizedPath', () => {
  it('classifies guest-only, protected, and public routes', () => {
    expect(parseLocalizedPath('/en/sign-in')?.kind).toBe('guest-only');
    expect(parseLocalizedPath('/fr/sign-up')?.kind).toBe('guest-only');
    expect(parseLocalizedPath('/ar/forgot-password')?.kind).toBe('guest-only');
    expect(parseLocalizedPath('/en/dashboard')?.kind).toBe('protected');
    expect(parseLocalizedPath('/en/dashboard/settings')?.kind).toBe('protected');
    expect(parseLocalizedPath('/en/s/acme')?.kind).toBe('protected');
    expect(parseLocalizedPath('/en/s')?.kind).toBe('public');
    expect(parseLocalizedPath('/en/spaces')?.kind).toBe('protected');
    expect(parseLocalizedPath('/fr/spaces/new')?.kind).toBe('protected');
    expect(parseLocalizedPath('/en/settings')?.kind).toBe('protected');
    expect(parseLocalizedPath('/en/notifications')?.kind).toBe('protected');
    expect(parseLocalizedPath('/en/reset-password')?.kind).toBe('public');
    expect(parseLocalizedPath('/en/verify-email')?.kind).toBe('public');
    expect(parseLocalizedPath('/en')?.kind).toBe('public');
    expect(parseLocalizedPath('/en/contact')?.kind).toBe('public');
  });

  it('ignores paths without a locale prefix', () => {
    expect(parseLocalizedPath('/sign-in')).toBeNull();
    expect(parseLocalizedPath('/dashboard')).toBeNull();
  });
});

describe('authRedirectPath', () => {
  it('sends signed-in users away from auth pages to their saved locale', () => {
    expect(
      authRedirectPath({
        pathname: '/en/sign-in',
        signedIn: true,
        userLocale: 'ar',
      })
    ).toBe('/ar/dashboard?land=1');
    expect(
      authRedirectPath({
        pathname: '/fr/sign-up',
        signedIn: true,
        userLocale: 'fr',
      })
    ).toBe('/fr/dashboard?land=1');
    expect(
      authRedirectPath({
        pathname: '/en/forgot-password',
        signedIn: true,
        userLocale: null,
      })
    ).toBe('/en/dashboard?land=1');
  });

  it('sends signed-out users away from the dashboard', () => {
    expect(
      authRedirectPath({
        pathname: '/en/dashboard',
        signedIn: false,
      })
    ).toBe('/en/sign-in');
    expect(
      authRedirectPath({
        pathname: '/ar/dashboard/settings',
        signedIn: false,
      })
    ).toBe('/ar/sign-in');
  });

  it('leaves public routes alone in both states', () => {
    for (const pathname of [
      '/en',
      '/en/contact',
      '/en/reset-password',
      '/en/verify-email',
    ]) {
      expect(
        authRedirectPath({ pathname, signedIn: true, userLocale: 'en' })
      ).toBeNull();
      expect(authRedirectPath({ pathname, signedIn: false })).toBeNull();
    }
  });

  it('treats a stale session as signed out (no loop off auth pages)', () => {
    expect(
      authRedirectPath({
        pathname: '/en/sign-in',
        signedIn: false,
      })
    ).toBeNull();
  });

  it('treats API-down (signedIn false) as fail-open on auth pages', () => {
    expect(
      authRedirectPath({
        pathname: '/en/sign-up',
        signedIn: false,
      })
    ).toBeNull();
  });

  it('falls back to the URL locale when the saved locale is invalid', () => {
    expect(
      authRedirectPath({
        pathname: '/en/sign-in',
        signedIn: true,
        userLocale: 'de',
      })
    ).toBe('/en/dashboard?land=1');
  });
});
