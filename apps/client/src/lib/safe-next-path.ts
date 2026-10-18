/**
 * Same-origin relative path for post-auth redirects (WH-010 / WH-045).
 * Rejects absolute URLs, protocol-relative URLs, and backslashes.
 */
export function safeNextPath(raw: string | null | undefined): string | null {
  if (!raw) {
    return null;
  }
  const value = raw.trim();
  if (!value.startsWith('/')) {
    return null;
  }
  if (value.startsWith('//') || value.includes('://') || value.includes('\\')) {
    return null;
  }
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code <= 0x1f || code === 0x7f) {
      return null;
    }
  }
  return value;
}
