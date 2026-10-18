import { expect, test } from '@playwright/test';
import { waitForEmailLink } from './helpers/mailpit.js';

const password = 'workhub-e2e-1';

test.describe('auth sign-up', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('signs up, verifies, lands signed in, and signs out via the menu', async ({
    page,
  }) => {
    const email = `e2e.${Date.now()}@workhub.test`;
    const name = 'E2E Signup';

    await page.goto('/en/sign-up');
    await page.getByLabel('Name').fill(name);
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page).toHaveURL(/\/en\/verify-email/);
    await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible();

    const verifyUrl = await waitForEmailLink({
      email,
      subject: /verify/i,
    });
    await page.goto(verifyUrl);

    // Verified users land on the dashboard hub; empty roster offers create.
    await expect(page).toHaveURL(/\/en\/dashboard/, { timeout: 20_000 });
    await expect(page.getByRole('link', { name: /Create/i })).toBeVisible();

    await page.getByRole('button', { name: `Account menu: ${name}` }).click();
    await expect(page.getByText(email)).toBeVisible();
    await page.getByRole('menuitem', { name: 'Sign out' }).click();

    await expect(page).toHaveURL(/\/en\/sign-in/, { timeout: 15_000 });
  });
});
