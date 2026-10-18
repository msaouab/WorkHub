import type { ConfigService } from '@nestjs/config';
import { describe, expect, it, vi } from 'vitest';
import { MailService, type MailConfig } from './mail.service';
import { escapeHtml } from './templates/layout';

const mailConfig: MailConfig = {
  host: 'localhost',
  port: 1025,
  secure: false,
  from: 'WorkHub <no-reply@test.local>',
};

function createService() {
  const config = { getOrThrow: () => mailConfig } as unknown as ConfigService;
  const service = new MailService(config);
  const sendMail = vi.spyOn(service['transporter'], 'sendMail');
  return { service, sendMail };
}

describe('MailService', () => {
  it('sends the verification email with the link, from the configured sender', async () => {
    const { service, sendMail } = createService();
    sendMail.mockResolvedValue({} as never);

    await expect(
      service.sendVerifyEmail('ali@test.local', 'Ali', 'https://x.test/verify?token=abc')
    ).resolves.toBe(true);

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: mailConfig.from,
        to: 'ali@test.local',
        subject: 'Verify your WorkHub email',
        text: expect.stringContaining('https://x.test/verify?token=abc'),
        html: expect.stringContaining('https://x.test/verify?token=abc'),
      })
    );
  });

  it('sends the password reset email with its 30-minute notice', async () => {
    const { service, sendMail } = createService();
    sendMail.mockResolvedValue({} as never);

    await expect(
      service.sendPasswordReset('ali@test.local', 'Ali', 'https://x.test/reset?token=abc')
    ).resolves.toBe(true);

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'Reset your WorkHub password',
        text: expect.stringContaining('30 minutes'),
      })
    );
  });

  it('sends a space invite email with the accept link', async () => {
    const { service, sendMail } = createService();
    sendMail.mockResolvedValue({} as never);
    const expiresAt = new Date('2026-10-24T12:00:00.000Z');

    await expect(
      service.sendSpaceInvite({
        to: 'mia@test.local',
        spaceName: 'Acme',
        roleName: 'Member',
        url: 'https://app.test/invite/tok',
        expiresAt,
      })
    ).resolves.toBe(true);

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'mia@test.local',
        subject: 'Join Acme on WorkHub',
        text: expect.stringContaining('https://app.test/invite/tok'),
        html: expect.stringContaining('https://app.test/invite/tok'),
      })
    );
  });

  it('escapes user-controlled names in the HTML part', async () => {
    const { service, sendMail } = createService();
    sendMail.mockResolvedValue({} as never);

    await service.sendPasswordReset('a@test.local', '<script>x</script>', 'https://x.test/reset');

    const html = String(sendMail.mock.calls[0][0].html);
    expect(html).not.toContain('<script>');
    expect(html).toContain(escapeHtml('<script>x</script>'));
  });

  it(
    'returns false instead of throwing when SMTP fails',
    async () => {
      const { service, sendMail } = createService();
      sendMail.mockRejectedValue(new Error('connect ECONNREFUSED'));

      await expect(
        service.sendVerifyEmail('a@test.local', 'A', 'https://x.test')
      ).resolves.toBe(false);
    },
    15_000
  );

  it('logs the error code when the message is empty, without the recipient', async () => {
    const { service, sendMail } = createService();
    const logError = vi.spyOn(service['logger'], 'error').mockImplementation(() => undefined);
    sendMail.mockRejectedValue(Object.assign(new AggregateError([], ''), { code: 'ECONNREFUSED' }));

    await service.sendVerifyEmail('secret@test.local', 'A', 'https://x.test');

    const logged = String(logError.mock.calls[0][0]);
    expect(logged).toContain('ECONNREFUSED');
    expect(logged).not.toContain('secret@test.local');
  });
});
