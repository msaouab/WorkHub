const SPLIT_RE = /[\s,;]+/;

/**
 * Parse pasted/typed invite addresses separated by comma, space, or newline.
 * Trims, lowercases for dedupe, preserves first-seen casing in the result.
 */
export function parseInviteEmails(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(SPLIT_RE)) {
    const email = part.trim();
    if (!email) {
      continue;
    }
    const key = email.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push(email);
  }
  return out;
}
