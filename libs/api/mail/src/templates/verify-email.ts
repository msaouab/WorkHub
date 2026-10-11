import { button, escapeHtml, layout, type EmailContent } from './layout';

export function verifyEmail({
  name,
  url,
}: {
  name: string;
  url: string;
}): EmailContent {
  return {
    subject: 'Verify your WorkHub email',
    text: `Hi ${name},\n\nConfirm your email address: ${url}\n\nThis link expires in 24 hours. If you didn't create a WorkHub account, ignore this email.`,
    html: layout(
      `<p>Hi ${escapeHtml(name)},</p>
       <p>Confirm your email address to finish creating your WorkHub account.</p>
       ${button(url, 'Verify email')}
       <p>This link expires in 24 hours. If you didn't create an account, you can ignore this email.</p>`
    ),
  };
}
