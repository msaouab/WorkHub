const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Escape user-controlled text (names, URLs) before it goes into email HTML. */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

export function button(url: string, label: string): string {
  return `<p><a href="${escapeHtml(url)}" style="display:inline-block;padding:10px 18px;background:#111;color:#fff;border-radius:6px;text-decoration:none">${escapeHtml(label)}</a></p>`;
}

export function layout(bodyHtml: string): string {
  return `<!doctype html><html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">${bodyHtml}<p style="color:#666;font-size:12px">— WorkHub</p></body></html>`;
}

/** Every email ships a plain-text part too: spam filters penalise HTML-only mail. */
export type EmailContent = {
  subject: string;
  text: string;
  html: string;
};
