/**
 * Local runs require an already-running `pnpm dev`. CI starts built apps via
 * Playwright `webServer` before this file runs.
 */
import { assertDevStackReachable } from './helpers/reachability.js';

export default async function globalSetup() {
  if (process.env['CI']) {
    return;
  }
  await assertDevStackReachable();
}
