'use client';

import { createAuthClient } from 'better-auth/react';
import { apiOrigin } from '@/lib/env';

/**
 * Browser client for Better Auth on the Nest API.
 * Session cookies are set on the API origin — always call from the client.
 */
export const authClient = createAuthClient({
  baseURL: apiOrigin(),
});
