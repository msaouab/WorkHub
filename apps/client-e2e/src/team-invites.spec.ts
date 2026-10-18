import { expect, test } from '@playwright/test';
import { authStatePath } from './helpers/env.js';
import { waitForEmailLink } from './helpers/mailpit.js';

test.describe('Team invitations (WH-073 / WH-072)', () => {
  test.use({ storageState: authStatePath('owner') });

  test('owner invites by email, sees pending badge, revoke → preview revoked', async ({
    page,
  }) => {
    const email = `e2e.invite.${Date.now()}@workhub.test`;

    await page.goto('/en/s/acme/team');
    await expect(page.getByRole('heading', { name: 'Team' })).toBeVisible();

    await page.getByRole('button', { name: 'Invite people' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'Invite people' })).toBeVisible();

    await dialog.getByLabel('Email addresses').fill(email);
    await dialog.getByLabel('Email addresses').press('Enter');
    await expect(dialog.getByText(email)).toBeVisible();
    await dialog.getByRole('button', { name: 'Send invites' }).click();
    await expect(dialog.getByRole('status')).toContainText(/Sent 1/);
    await dialog.getByRole('button', { name: 'Close' }).click();

    await page.getByRole('tab', { name: /Invitations/ }).click();
    await expect(page).toHaveURL(/tab=invitations/);
    await expect(
      page.getByRole('tab', { name: /Invitations/ })
    ).toContainText(/[1-9]/);
    await expect(page.getByRole('cell', { name: email })).toBeVisible();

    const inviteUrl = await waitForEmailLink({
      email,
      subject: /invite|join|acme/i,
    });

    const row = page.getByRole('row').filter({ hasText: email });
    await row.getByRole('button', { name: 'Revoke' }).click();
    const confirm = page.getByRole('dialog');
    await expect(
      confirm.getByRole('heading', { name: 'Revoke invite?' })
    ).toBeVisible();
    await confirm.getByRole('button', { name: 'Revoke' }).click();
    await expect(page.getByRole('cell', { name: email })).toHaveCount(0);

    await page.goto(inviteUrl);
    await expect(
      page.getByRole('heading', { name: 'Invite unavailable' })
    ).toBeVisible();
    await expect(page.getByText('This invite was revoked.')).toBeVisible();
  });
});
