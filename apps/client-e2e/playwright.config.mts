import { defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';

const baseURL = process.env['BASE_URL'] || 'http://localhost:3000';

/**
 * Auth e2e needs the Next client, Nest API, Postgres, and Mailpit.
 * Reuse a running `pnpm dev` + `docker compose` when present.
 */
export default defineConfig({
  ...nxE2EPreset(import.meta.dirname, { testDir: './src' }),
  timeout: 90_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'pnpm exec nx serve server',
      url: 'http://localhost:3333/health/live',
      reuseExistingServer: true,
      cwd: workspaceRoot,
      timeout: 120_000,
    },
    {
      command: 'pnpm exec nx dev @work-hub/client',
      url: 'http://localhost:3000',
      reuseExistingServer: true,
      cwd: workspaceRoot,
      timeout: 120_000,
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
