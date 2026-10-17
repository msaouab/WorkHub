/**
 * Initials from a display name (first letters of the first two words).
 * Works for Arabic and Latin; empty/whitespace → "?".
 */
export function initialsFromName(name: string | null | undefined): string {
  const parts = (name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  if (parts.length === 1) {
    return (parts[0]?.slice(0, 1) || '?').toUpperCase();
  }
  const a = parts[0]?.slice(0, 1);
  const b = parts[1]?.slice(0, 1);
  return `${a}${b}`.toUpperCase();
}

/**
 * Stable HSL background from an id (user or space), for avatar / logo fallbacks.
 */
export function colorFromId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  const hue = hash % 360;
  return `oklch(0.72 0.12 ${hue})`;
}
