import { describe, expect, it } from 'vitest';
import { createSpaceSchema, spaceSlugSchema } from './spaces';

describe('spaceSlugSchema', () => {
  it('accepts simple and hyphenated slugs', () => {
    expect(spaceSlugSchema.parse('acme')).toBe('acme');
    expect(spaceSlugSchema.parse('acme-corp')).toBe('acme-corp');
  });

  it('rejects uppercase, spaces, and leading hyphens', () => {
    expect(() => spaceSlugSchema.parse('Acme')).toThrow();
    expect(() => spaceSlugSchema.parse('acme corp')).toThrow();
    expect(() => spaceSlugSchema.parse('-acme')).toThrow();
  });
});

describe('createSpaceSchema', () => {
  it('is strict about unknown fields', () => {
    expect(() =>
      createSpaceSchema.parse({ name: 'Acme', slug: 'acme', extra: true })
    ).toThrow();
  });

  it('trims the name', () => {
    expect(
      createSpaceSchema.parse({ name: '  Acme  ', slug: 'acme' })
    ).toEqual({ name: 'Acme', slug: 'acme' });
  });
});
