import { button, escapeHtml, layout, type EmailContent } from './layout';

export function resetPasswordEmail({
  name,
  url,
}: {
  name: string;
  url: string;
}): EmailContent {
  return {
    subject: 'Reset your WorkHub password',
    text: `Hi ${name},\n\nReset your password: ${url}\n\nThis link expires in 30 minutes. If you didn't ask for this, ignore this email — your password stays the same.`,
    html: layout(
      `<p>Hi ${escapeHtml(name)},</p>
       <p>We received a request to reset your password.</p>
       ${button(url, 'Reset password')}
       <p>This link expires in 30 minutes. If you didn't ask for this, ignore this email — your password stays the same.</p>`
    ),
  };
}
