import { describe, expect, it } from 'vitest';
import { updateMeSchema } from './me';

describe('updateMeSchema', () => {
  it.each(['en', 'ar', 'fr'])('accepts %s', (locale) => {
    expect(updateMeSchema.parse({ locale })).toEqual({ locale });
  });

  it('rejects an unsupported language', () => {
    expect(updateMeSchema.safeParse({ locale: 'de' }).success).toBe(false);
  });

  it('rejects unknown fields instead of ignoring them', () => {
    expect(updateMeSchema.safeParse({ locale: 'fr', role: 'admin' }).success).toBe(false);
  });
});