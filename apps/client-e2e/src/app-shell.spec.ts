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
  // Seeded member's saved locale is `ar` — land=1 may send them through dashboard first.
  await expect(page).toHaveURL(/\/(en|ar|fr)\/(dashboard|s\/|spaces)/, {
    timeout: 20_000,
  });
}

test.describe('app shell (WH-052)', () => {
  test('member sees workspace sidebar without Manage; drawer works on phone', async ({
    page,
  }) => {
    await signIn(page, 'member@workhub.test');
    // Force English labels for the assertions below.
    await page.goto('/en/s/acme');

    // Desktop sidebar only (drawer keeps a second nav in the DOM while closed).
    const nav = page
      .getByRole('navigation', { name: 'Workspace' })
      .filter({ visible: true });
    await expect(nav).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Home' })).toBeVisible();
    // Members stays out of the nav until WH-046; Manage (Settings) is Owner-only.
    await expect(nav.getByRole('link', { name: 'Members' })).toHaveCount(0);
    await expect(nav.getByRole('link', { name: 'Settings' })).toHaveCount(0);
    await expect(page.getByText('Manage', { exact: true })).toHaveCount(0);

    await page.setViewportSize({ width: 375, height: 812 });
    await expect(nav).toBeHidden();

    await page.getByRole('button', { name: 'Open menu' }).click();
    const drawer = page.getByRole('dialog');
    await expect(
      drawer.getByRole('navigation', { name: 'Workspace' })
    ).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
  });

  test('dashboard has no sidebar; settings shows account nav', async ({
    page,
  }) => {
    await signIn(page, 'member@workhub.test');

    await page.goto('/en/dashboard');
    await expect(
      page.getByRole('navigation', { name: 'Workspace' })
    ).toHaveCount(0);
    await expect(
      page.getByRole('heading', { name: 'Your workspaces' })
    ).toBeVisible();

    await page.goto('/en/settings');
    await expect(
      page.getByRole('navigation', { name: 'Account settings' })
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Profile' })
    ).toHaveAttribute('aria-current', 'page');
  });
});
