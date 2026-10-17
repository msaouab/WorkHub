'use client';

import { inferAdditionalFields } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';
import { apiOrigin } from '@/lib/env';

/**
 * Browser client for Better Auth on the Nest API.
 * Session cookies are set on the API origin — always call from the client.
 * `locale` is stored on the user (set at sign-up via `x-workhub-locale`, not the body).
 */
export const authClient = createAuthClient({
  baseURL: apiOrigin(),
  plugins: [
    inferAdditionalFields({
      user: {
        locale: { type: 'string', input: false },
      },
    }),
  ],
});
