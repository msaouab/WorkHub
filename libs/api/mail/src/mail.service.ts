import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';
import type { EmailContent } from './templates/layout';
import { resetPasswordEmail } from './templates/reset-password';
import { spaceInviteEmail } from './templates/space-invite';
import { verifyEmail } from './templates/verify-email';

export type MailConfig = {
  host: string;
  port: number;
  /** true = TLS from the first byte (port 465); false = plain or STARTTLS (1025 Mailpit, 587). */
  secure: boolean;
  user?: string;
  pass?: string;
  /** e.g. "WorkHub <no-reply@workhub.app>" */
  from: string;
};

/**
 * Connection failures to a host with several addresses (localhost → ::1 + 127.0.0.1)
 * arrive as an AggregateError with an empty message; the reason is in `code`.
 */
function describeError(error: unknown): string {
  const { message, code } = error as { message?: string; code?: string };
  return message || code || String(error);
}

/**
 * Sends transactional email over SMTP (Mailpit locally).
 * Reads the `mail` key of the app config (see apps/server/src/config/configuration.ts).
 */
@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(config: ConfigService) {
    const mail = config.getOrThrow<MailConfig>('mail');
    this.from = mail.from;
    this.transporter = createTransport({
      host: mail.host,
      port: mail.port,
      secure: mail.secure,
      auth: mail.user ? { user: mail.user, pass: mail.pass } : undefined,
    });
  }

  /** Warn at boot if SMTP is unreachable, but don't crash: sign-in must keep working. */
  async onModuleInit() {
    try {
      await this.transporter.verify();
    } catch (error) {
      this.logger.warn(`SMTP not reachable: ${describeError(error)}`);
    }
  }

  sendVerifyEmail(to: string, name: string, url: string): Promise<boolean> {
    return this.send(to, verifyEmail({ name, url }));
  }

  sendPasswordReset(to: string, name: string, url: string): Promise<boolean> {
    return this.send(to, resetPasswordEmail({ name, url }));
  }

  /** English invite email (WH-010); per-locale copy is WH-013. */
  sendSpaceInvite(input: {
    to: string;
    spaceName: string;
    roleName: string;
    url: string;
    expiresAt: Date;
  }): Promise<boolean> {
    return this.send(
      input.to,
      spaceInviteEmail({
        spaceName: input.spaceName,
        roleName: input.roleName,
        url: input.url,
        expiresAt: input.expiresAt,
      })
    );
  }

  /**
   * Never throws: auth flows fire-and-forget, so an SMTP outage must not fail a sign-up.
   * Logs the subject only — recipient addresses are personal data.
   */
  private async send(to: string, content: EmailContent): Promise<boolean> {
    try {
      await this.transporter.sendMail({ from: this.from, to, ...content });
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send "${content.subject}": ${describeError(error)}`
      );
      return false;
    }
  }
}
