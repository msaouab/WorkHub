import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchProxySession } from '../src/lib/auth-session';

describe('fetchProxySession', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000');
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://localhost:3333');
    vi.stubEnv('NEXT_PUBLIC_API_PREFIX', 'api/v1');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns unknown when the session fetch never resolves (timeout)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init?: RequestInit) => {
        return new Promise((_resolve, reject) => {
          const signal = init?.signal;
          if (!signal) {
            return;
          }
          if (signal.aborted) {
            reject(new DOMException('Aborted', 'AbortError'));
            return;
          }
          signal.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'));
          });
        });
      })
    );

    await expect(fetchProxySession('session=abc')).resolves.toEqual({
      status: 'unknown',
    });
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3333/api/auth/get-session',
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      })
    );
  });

  it('returns signed-in when get-session succeeds', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ user: { id: 'u1', locale: 'ar' } }),
      })
    );

    await expect(fetchProxySession('session=abc')).resolves.toEqual({
      status: 'signed-in',
      session: { user: { id: 'u1', locale: 'ar' } },
    });
  });

  it('returns signed-out when get-session has no user', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ user: null }),
      })
    );

    await expect(fetchProxySession(null)).resolves.toEqual({
      status: 'signed-out',
    });
  });

  it('returns unknown on 5xx and 429', async () => {
    for (const status of [500, 503, 429]) {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status,
          json: async () => ({}),
        })
      );
      await expect(fetchProxySession('session=abc')).resolves.toEqual({
        status: 'unknown',
      });
    }
  });

  it('returns unknown on network failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new TypeError('fetch failed'))
    );

    await expect(fetchProxySession('session=abc')).resolves.toEqual({
      status: 'unknown',
    });
  });
});
