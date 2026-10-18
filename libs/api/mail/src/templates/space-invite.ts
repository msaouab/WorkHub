import { button, escapeHtml, layout, type EmailContent } from './layout';

export function spaceInviteEmail({
  spaceName,
  roleName,
  url,
  expiresAt,
}: {
  spaceName: string;
  roleName: string;
  url: string;
  expiresAt: Date;
}): EmailContent {
  const when = expiresAt.toUTCString();
  return {
    subject: `Join ${spaceName} on WorkHub`,
    text: `You've been invited to join ${spaceName} on WorkHub as ${roleName}.\n\nAccept the invite: ${url}\n\nThis link expires on ${when}. If you weren't expecting this, you can ignore this email.`,
    html: layout(
      `<p>You've been invited to join <strong>${escapeHtml(spaceName)}</strong> on WorkHub as <strong>${escapeHtml(roleName)}</strong>.</p>
       ${button(url, 'Accept invite')}
       <p>This link expires on ${escapeHtml(when)}. If you weren't expecting this, you can ignore this email.</p>`
    ),
  };
}
