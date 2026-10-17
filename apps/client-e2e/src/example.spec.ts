import { expect, test } from '@playwright/test';

test('landing page loads', async ({ page }) => {
  await page.goto('/en');
  await expect(
    page.getByRole('heading', { name: /Leave and papers/i })
  ).toBeVisible();
});
