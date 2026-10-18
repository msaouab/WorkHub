import { expect, test } from '@playwright/test';
import { seedAccounts, seedPassword } from './helpers/env.js';

/**
 * One form-based sign-in (WH-072). Other specs use API storageState so a full
 * run stays under Better Auth's 5 sign-ins / minute limit.
 */
test.describe('auth sign-in form', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('signs in through the email form and lands in the app', async ({
    page,
  }) => {
    await page.goto('/en/sign-in');
    await page.getByLabel('Email').fill(seedAccounts.owner.email);
    await page.getByLabel('Password', { exact: true }).fill(seedPassword);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/(en|ar|fr)\/(dashboard|s\/|spaces)/, {
      timeout: 20_000,
    });
  });
});
