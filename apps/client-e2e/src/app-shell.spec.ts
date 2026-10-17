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
  test('owner sees full nav and every item opens its route', async ({
    page,
  }) => {
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

    const routes: { path: string; heading: string; soon?: boolean }[] = [
      { path: '/en/s/acme/leave', heading: 'My leave', soon: true },
      { path: '/en/s/acme/calendar', heading: 'Team calendar', soon: true },
      { path: '/en/s/acme/holidays', heading: 'Holidays', soon: true },
      { path: '/en/s/acme/documents', heading: 'Documents', soon: true },
      { path: '/en/s/acme/people', heading: 'People', soon: true },
      { path: '/en/s/acme/approvals', heading: 'Approvals', soon: true },
      { path: '/en/s/acme/invites', heading: 'Invites', soon: true },
      {
        path: '/en/s/acme/roles',
        heading: 'Roles and permissions',
        soon: true,
      },
      { path: '/en/s/acme/teams', heading: 'Teams', soon: true },
      {
        path: '/en/s/acme/leave-policies',
        heading: 'Leave policies',
        soon: true,
      },
      { path: '/en/s/acme/settings', heading: 'Workspace settings' },
    ];

    for (const item of routes) {
      await page.goto(item.path);
      await expect(
        page.getByRole('heading', { name: item.heading })
      ).toBeVisible();
      if (item.soon) {
        await expect(
          page.getByText("We're building this. It'll be ready soon.")
        ).toBeVisible();
      }
    }
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
    await expect(
      page.getByText("You don't have access to this page.")
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Back to workspace home' })
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
