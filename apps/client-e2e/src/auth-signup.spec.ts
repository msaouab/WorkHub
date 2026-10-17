import { expect, test } from '@playwright/test';

const MAILPIT = process.env['MAILPIT_URL'] ?? 'http://localhost:8025';
const password = 'workhub-e2e-1';

type MailpitMessageSummary = {
  ID: string;
  To: Array<{ Address: string }>;
  Subject: string;
};

type MailpitMessage = {
  ID: string;
  Text: string;
  HTML: string;
};

async function waitForVerifyLink(email: string): Promise<string> {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    const list = (await (
      await fetch(`${MAILPIT}/api/v1/messages`)
    ).json()) as { messages: MailpitMessageSummary[] };

    const match = list.messages?.find(
      (message) =>
        message.To?.some((to) => to.Address === email) &&
        /verify/i.test(message.Subject)
    );

    if (match) {
      const full = (await (
        await fetch(`${MAILPIT}/api/v1/message/${match.ID}`)
      ).json()) as MailpitMessage;
      const body = `${full.Text}\n${full.HTML}`;
      const url = body.match(/https?:\/\/[^\s"'<>]+/i)?.[0];
      if (url) {
        return url.replace(/&amp;/g, '&');
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`No verification email for ${email} in Mailpit within 30s`);
}

test.describe('auth sign-up', () => {
  test('signs up, verifies via Mailpit, and lands signed in on /app', async ({
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

    const verifyUrl = await waitForVerifyLink(email);
    await page.goto(verifyUrl);

    await expect(page).toHaveURL(/\/en\/app/, { timeout: 20_000 });
    await expect(
      page.getByRole('heading', { name: "You're signed in" })
    ).toBeVisible();
    await expect(page.getByText(name)).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();
  });
});
