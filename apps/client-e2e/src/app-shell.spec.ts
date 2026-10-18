import { expect, test } from '@playwright/test';
import { authStatePath } from './helpers/env.js';

test.describe('app shell (WH-053) — owner', () => {
  test.use({ storageState: authStatePath('owner') });

  test('owner sees full nav and every item opens its route', async ({
    page,
  }) => {
    await page.goto('/en/s/acme');

    // Desktop sidebar only (drawer keeps a duplicate nav in the DOM).
    const desktop = page.locator('div.hidden.lg\\:flex');
    const nav = desktop.getByRole('navigation', { name: 'Workspace' });
    await expect(nav.getByRole('link', { name: 'Home' })).toBeVisible();
    await expect(nav.getByRole('link', { name: /My leave/ })).toBeVisible();
    await expect(
      nav.getByRole('link', { name: 'Team', exact: true })
    ).toBeVisible();
    await expect(desktop.getByText('Manage', { exact: true })).toBeVisible();
    await expect(nav.getByRole('link', { name: /Settings/ })).toBeVisible();

    const comingSoonRoutes = [
      { path: '/en/s/acme/leave', heading: 'My leave' },
      { path: '/en/s/acme/calendar', heading: 'Team calendar' },
      { path: '/en/s/acme/holidays', heading: 'Holidays' },
      { path: '/en/s/acme/documents', heading: 'Documents' },
      { path: '/en/s/acme/approvals', heading: 'Approvals' },
      { path: '/en/s/acme/leave-policies', heading: 'Leave policies' },
    ] as const;

    for (const item of comingSoonRoutes) {
      await page.goto(item.path);
      await expect(
        page.getByRole('heading', { name: item.heading })
      ).toBeVisible();
      await expect(
        page.getByText("We're building this. It'll be ready soon.")
      ).toBeVisible();
    }

    // WH-011: Roles is a real page (not coming soon).
    await page.goto('/en/s/acme/roles');
    await expect(
      page.getByRole('heading', { name: 'Roles and permissions' })
    ).toBeVisible();
    await expect(
      page.getByText("We're building this. It'll be ready soon.")
    ).toHaveCount(0);

    await page.goto('/en/s/acme/team');
    await expect(page.getByRole('heading', { name: 'Team' })).toBeVisible();
    await expect(
      page.getByRole('tab', { name: /Members/ })
    ).toBeVisible();

    await page.goto('/en/s/acme/settings');
    await expect(
      page.getByRole('heading', { name: 'Workspace settings' })
    ).toBeVisible();
  });
});

test.describe('app shell (WH-053) — member', () => {
  test.use({ storageState: authStatePath('member') });

  test('member has no Manage; roles URL is no access', async ({ page }) => {
    await page.goto('/en/s/acme');

    const nav = page
      .locator('div.hidden.lg\\:flex')
      .getByRole('navigation', { name: 'Workspace' });
    await expect(nav.getByRole('link', { name: 'Home' })).toBeVisible();
    await expect(
      nav.getByRole('link', { name: 'Team', exact: true })
    ).toBeVisible();
    await expect(
      page.locator('div.hidden.lg\\:flex').getByText('Manage', { exact: true })
    ).toHaveCount(0);
    await expect(nav.getByRole('link', { name: /Settings/ })).toHaveCount(0);

    await page.goto('/en/s/acme/roles');
    await expect(
      page.getByRole('heading', { name: 'No access' })
    ).toBeVisible();
    await expect(
      page.getByText("You don't have access to this page.")
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Back to workspace home' })
    ).toBeVisible();
  });

  test('settings lists coming-soon items', async ({ page }) => {
    await page.goto('/en/settings');
    await expect(
      page.getByRole('link', { name: /Sign-in methods/ })
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /Delete account/ })
    ).toBeVisible();
  });
});

test.describe('app shell redirects', () => {
  test('members redirects to team', async ({ request }) => {
    const res = await request.get('/en/s/acme/members', { maxRedirects: 0 });
    expect([301, 308]).toContain(res.status());
    expect(res.headers()['location'] ?? '').toMatch(
      /\/en\/s\/acme\/team(\?tab=members)?$/
    );
  });
});
