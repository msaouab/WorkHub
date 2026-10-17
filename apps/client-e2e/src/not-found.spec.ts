import { expect, test } from '@playwright/test';

test.describe('404 page (WH-051)', () => {
  test('returns HTTP 404 with translated heading in en and ar', async ({
    page,
    request,
  }) => {
    const enStatus = await request.get('/en/does-not-exist');
    expect(enStatus.status()).toBe(404);

    await page.goto('/en/does-not-exist');
    await expect(
      page.getByRole('heading', { name: 'Page not found' })
    ).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      /noindex/
    );

    const arStatus = await request.get('/ar/nope/deep');
    expect(arStatus.status()).toBe(404);

    await page.goto('/ar/nope/deep');
    await expect(
      page.getByRole('heading', { name: 'الصفحة غير موجودة' })
    ).toBeVisible();
  });

  test('locale-less unknown path redirects then 404s', async ({ request }) => {
    const response = await request.get('/does-not-exist', {
      maxRedirects: 0,
    });
    expect([307, 308]).toContain(response.status());
    const location = response.headers()['location'] ?? '';
    expect(location).toMatch(/\/en\/does-not-exist/);

    const after = await request.get('/does-not-exist');
    expect(after.status()).toBe(404);
  });
});
