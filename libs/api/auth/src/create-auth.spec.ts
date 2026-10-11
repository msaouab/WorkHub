import type { PrismaService } from '@work-hub/database';
import type { MailService } from '@work-hub/mail';
import { describe, expect, it } from 'vitest';
import { AUTH_BASE_PATH, createAuth } from './create-auth';

// Disabled paths are rejected before any database or mail call, so empty stubs are enough.
const auth = createAuth({
  prisma: {} as PrismaService,
  mail: {} as MailService,
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
