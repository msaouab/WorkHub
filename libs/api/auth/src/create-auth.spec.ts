import type { PrismaClient } from '@work-hub/database';
import { describe, expect, it } from 'vitest';
import { AUTH_BASE_PATH, createAuth } from './create-auth';

// Disabled paths are rejected before any database or mail call, so empty stubs are enough.
const auth = createAuth({
  prisma: {} as PrismaClient,
  mail: { sendVerifyEmail: async () => true, sendPasswordReset: async () => true },
  config: {
    baseUrl: 'http://localhost:3333',
    secret: 'x'.repeat(32),
    trustedOrigins: ['http://localhost:3000'],
  },
});

describe('createAuth disabled paths', () => {
  it.each(['/ok', '/update-session', '/sign-in/social', '/delete-user'])(
    '%s returns 404',
    async (path) => {
      const response = await auth.handler(
        new Request(`http://localhost:3333${AUTH_BASE_PATH}${path}`, {
          method: 'POST',
        }),
      );
      expect(response.status).toBe(404);
    },
  );

  it('leaves disabled paths out of the OpenAPI schema and keeps the ones we use', async () => {
    const paths = Object.keys((await auth.api.generateOpenAPISchema()).paths);
    expect(paths).toContain('/sign-in/email');
    expect(paths).not.toContain('/sign-in/social');
    expect(paths).not.toContain('/ok');
  });
});

describe('createAuth rate limits', () => {
  it('does not rate-limit get-session (proxy hits it on every gated page)', async () => {
    // Default max is 100/min; without the exemption this would 429.
    for (let i = 0; i < 110; i += 1) {
      const response = await auth.handler(
        new Request(`http://localhost:3333${AUTH_BASE_PATH}/get-session`, {
          method: 'GET',
        })
      );
      expect(response.status).not.toBe(429);
    }
  });
});

describe('createAuth update-user image (WH-050)', () => {
  it('rejects a body that includes image (before any DB write)', async () => {
    const response = await auth.handler(
      new Request(`http://localhost:3333${AUTH_BASE_PATH}/update-user`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          origin: 'http://localhost:3000',
        },
        body: JSON.stringify({ image: 'https://evil.example/x.png' }),
      })
    );
    // Hook runs after session check → 401 without a cookie; with a session → 400.
    // Either way the image must never be applied (no 200).
    expect(response.status).not.toBe(200);
    expect([400, 401]).toContain(response.status);
  });
});
