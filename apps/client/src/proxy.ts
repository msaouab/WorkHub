import createMiddleware from 'next-intl/middleware';
import { type NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';
import { authRedirectPath, parseLocalizedPath } from './lib/auth-proxy';
import { fetchProxySession } from './lib/auth-session';

const intlMiddleware = createMiddleware(routing);

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const localized = parseLocalizedPath(pathname);

  if (localized && localized.kind !== 'public') {
    const result = await fetchProxySession(request.headers.get('cookie'));

    // Timeout / 5xx / network: don't redirect — page + useRequireAuth decide (WH-045).
    if (result.status !== 'unknown') {
      const redirectTo = authRedirectPath({
        pathname,
        search: request.nextUrl.search,
        signedIn: result.status === 'signed-in',
        userLocale:
          result.status === 'signed-in' ? result.session.user.locale : undefined,
      });
      if (redirectTo) {
        // Path + query separately — assigning "?…" to pathname encodes `?` (WH-052).
        const target = new URL(redirectTo, request.nextUrl.origin);
        const url = request.nextUrl.clone();
        url.pathname = target.pathname;
        url.search = target.search;
        return NextResponse.redirect(url);
      }
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)',
};
