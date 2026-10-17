/**
 * Suggest a URL slug from a workspace name (matches `spaceSlugSchema` shape).
 * Non-Latin names (e.g. Arabic) yield `''` — the form leaves the slug empty
 * and shows a Latin-letters hint instead of auto-filling garbage.
 */
export function suggestSpaceSlug(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
    .replace(/-+$/g, '');
}
