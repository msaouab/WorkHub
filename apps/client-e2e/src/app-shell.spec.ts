import { expect, test } from '@playwright/test';

const password = process.env['SEED_PASSWORD'] ?? 'workhub-dev-1';

async function signIn(
  page: import('@playwright/test').Page,
  email: string
) {
  await page.goto('/en/sign-in');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/(en|ar|fr)\/(dashboard|s\/|spaces)/, {
    timeout: 20_000,
  });
}

test.describe('app shell (WH-053)', () => {
  test('owner sees full nav; member has no Manage', async ({ page }) => {
    await signIn(page, 'owner@workhub.test');
    await page.goto('/en/s/acme');

    // Desktop sidebar only (drawer keeps a duplicate nav in the DOM).
    const desktop = page.locator('div.hidden.lg\\:flex');
    const nav = desktop.getByRole('navigation', { name: 'Workspace' });
    await expect(nav.getByRole('link', { name: 'Home' })).toBeVisible();
    await expect(nav.getByRole('link', { name: /My leave/ })).toBeVisible();
    await expect(nav.getByRole('link', { name: /People/ })).toBeVisible();
    await expect(desktop.getByText('Manage', { exact: true })).toBeVisible();
    await expect(nav.getByRole('link', { name: /Settings/ })).toBeVisible();

    await nav.getByRole('link', { name: /My leave/ }).click();
    await expect(page).toHaveURL(/\/en\/s\/acme\/leave/);
    await expect(
      page.getByRole('heading', { name: 'My leave' })
    ).toBeVisible();
    await expect(
      page.getByText("We're building this. It'll be ready soon.")
    ).toBeVisible();
  });

  test('member has no Manage; roles URL is no access', async ({ page }) => {
    await signIn(page, 'member@workhub.test');
    await page.goto('/en/s/acme');

    const nav = page
      .locator('div.hidden.lg\\:flex')
      .getByRole('navigation', { name: 'Workspace' });
    await expect(nav.getByRole('link', { name: 'Home' })).toBeVisible();
    await expect(nav.getByRole('link', { name: /People/ })).toBeVisible();
    await expect(
      page.locator('div.hidden.lg\\:flex').getByText('Manage', { exact: true })
    ).toHaveCount(0);
    await expect(nav.getByRole('link', { name: /Settings/ })).toHaveCount(0);

    await page.goto('/en/s/acme/roles');
    await expect(
      page.getByRole('heading', { name: 'No access' })
    ).toBeVisible();
  });

  test('members redirects to people; settings lists coming-soon items', async ({
    page,
    request,
  }) => {
    const res = await request.get('/en/s/acme/members', { maxRedirects: 0 });
    expect([301, 308]).toContain(res.status());
    expect(res.headers()['location'] ?? '').toMatch(/\/en\/s\/acme\/people$/);

    await signIn(page, 'member@workhub.test');
    await page.goto('/en/settings');
    await expect(
      page.getByRole('link', { name: /Sign-in methods/ })
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /Delete account/ })
    ).toBeVisible();
  });
});
