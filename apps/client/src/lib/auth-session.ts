import { apiOrigin } from '@/lib/env';

export const PROXY_SESSION_TIMEOUT_MS = 1_500;

export type ProxySession = {
  user: {
    id: string;
    locale?: string | null;
  };
};

/**
 * Three-state session for the edge proxy (WH-045).
 * - signed-in: get-session returned a user
 * - signed-out: get-session returned 200 with no user (or a definitive auth failure)
 * - unknown: timeout, 5xx, 429, or network — do not redirect; let the page decide
 */
export type ProxySessionResult =
  | { status: 'signed-in'; session: ProxySession }
  | { status: 'signed-out' }
  | { status: 'unknown' };

/**
 * Ask the API whether this request has a real session.
 * Never invent "signed out" from a timeout or API blip — that logs people out (WH-045).
 */
export async function fetchProxySession(
  cookieHeader: string | null
): Promise<ProxySessionResult> {
  try {
    const response = await fetch(`${apiOrigin()}/api/auth/get-session`, {
      method: 'GET',
      headers: cookieHeader ? { cookie: cookieHeader } : {},
      cache: 'no-store',
      signal: AbortSignal.timeout(PROXY_SESSION_TIMEOUT_MS),
    });

    if (response.status === 429 || response.status >= 500) {
      return { status: 'unknown' };
    }

    if (!response.ok) {
      return { status: 'signed-out' };
    }

    const data = (await response.json()) as {
      user?: { id?: string; locale?: string | null } | null;
    } | null;

    if (!data?.user?.id) {
      return { status: 'signed-out' };
    }

    return {
      status: 'signed-in',
      session: {
        user: {
          id: data.user.id,
          locale: data.user.locale,
        },
      },
    };
  } catch {
    return { status: 'unknown' };
  }
}
