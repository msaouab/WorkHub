import { describe, expect, it } from 'vitest';
import { suggestSpaceSlug } from '../src/lib/space-slug';

describe('suggestSpaceSlug', () => {
  it('normalizes names into URL-safe slugs', () => {
    expect(suggestSpaceSlug('Acme Corp')).toBe('acme-corp');
    expect(suggestSpaceSlug('  Hello---World  ')).toBe('hello-world');
    expect(suggestSpaceSlug('Café')).toBe('cafe');
  });

  it('returns empty for non-Latin names so the form can show a hint', () => {
    expect(suggestSpaceSlug('شركة الأمل')).toBe('');
  });
});
