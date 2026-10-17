import { describe, expect, it } from 'vitest';
import { authRedirectPath } from '../src/lib/auth-proxy';

/**
 * Mirrors how `proxy.ts` builds the Location URL from authRedirectPath.
 * Guards against encoding `?` into the pathname (WH-052 / WH-045 review).
 */
function locationFromRedirect(redirectTo: string, origin = 'http://localhost:3000') {
  const target = new URL(redirectTo, origin);
  const url = new URL('/en/sign-in', origin);
  url.pathname = target.pathname;
  url.search = target.search;
  return url.pathname + url.search;
}

describe('proxy redirect Location', () => {
  it('keeps land=1 as a query string, not in the pathname', () => {
    const redirectTo = authRedirectPath({
      pathname: '/en/sign-in',
      signedIn: true,
      userLocale: 'ar',
    });
    expect(redirectTo).toBe('/ar/dashboard?land=1');
    if (!redirectTo) {
      throw new Error('expected redirect');
    }
    expect(locationFromRedirect(redirectTo)).toBe('/ar/dashboard?land=1');
    expect(locationFromRedirect(redirectTo)).not.toContain('%3F');
  });
});
