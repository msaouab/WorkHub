import { expect, request, test as setup } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import {
  apiURL,
  authStatePath,
  baseURL,
  seedAccounts,
  seedPassword,
  type SeedRole,
} from './helpers/env.js';

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Better Auth caps sign-in at 5/min on one IP. Local re-runs (and the one
 * form-based sign-in test) share that budget, so retry on 429.
 */
async function signInViaApi(role: SeedRole) {
  const account = seedAccounts[role];
  const context = await request.newContext({
    baseURL: apiURL,
    extraHTTPHeaders: {
      Origin: baseURL,
      'Content-Type': 'application/json',
    },
  });

  let lastStatus = 0;
  let lastBody = '';
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const response = await context.post('/api/auth/sign-in/email', {
      data: {
        email: account.email,
        password: seedPassword,
      },
    });
    lastStatus = response.status();
    lastBody = await response.text();

    if (response.ok()) {
      const path = authStatePath(role);
      mkdirSync(dirname(path), { recursive: true });
      await context.storageState({ path });
      await context.dispose();
      return;
    }

    if (response.status() === 429) {
      // Window is 60s; wait a slice and retry.
      await sleep(12_000);
      continue;
    }

    break;
  }

  await context.dispose();
  expect(
    false,
    `sign-in as ${role} failed: ${lastStatus} ${lastBody}`
  ).toBeTruthy();
}

setup.describe.configure({ mode: 'serial' });

setup('authenticate as owner', async () => {
  await signInViaApi('owner');
});

setup('authenticate as admin', async () => {
  await signInViaApi('admin');
});

setup('authenticate as member', async () => {
  await signInViaApi('member');
});
