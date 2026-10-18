import { defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';
import { apiURL, baseURL } from './src/helpers/env.js';

const isCi = Boolean(process.env['CI']);

/**
 * Auth e2e needs the Next client, Nest API, Postgres, and Mailpit.
 *
 * Local (WH-072): require a running `pnpm dev` — do not auto-start a second
 * Nest serve beside it. One Playwright worker avoids hammering `next dev`.
 *
 * CI (WH-069): start the built apps; parallel workers are fine.
 */
export default defineConfig({
  ...nxE2EPreset(import.meta.dirname, { testDir: './src' }),
  timeout: 90_000,
  expect: { timeout: 15_000 },
  workers: isCi ? undefined : 1,
  globalSetup: './src/global-setup.mts',
  globalTeardown: './src/global-teardown.mts',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  webServer: isCi
    ? [
        {
          command: 'node apps/server/dist/main.js',
          url: `${apiURL}/health/live`,
          reuseExistingServer: false,
          cwd: workspaceRoot,
          timeout: 120_000,
        },
        {
          command: 'pnpm exec next start',
          url: baseURL,
          reuseExistingServer: false,
          cwd: `${workspaceRoot}/apps/client`,
          timeout: 120_000,
        },
      ]
    : undefined,
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
      testIgnore: /auth\.setup\.ts/,
    },
  ],
});
