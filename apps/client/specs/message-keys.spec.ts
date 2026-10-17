import { describe, expect, it } from 'vitest';
import ar from '../src/messages/ar.json';
import en from '../src/messages/en.json';
import fr from '../src/messages/fr.json';

function collectKeys(value: unknown, prefix = ''): string[] {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return prefix ? [prefix] : [];
  }

  return Object.entries(value as Record<string, unknown>).flatMap(
    ([key, nested]) => {
      const path = prefix ? `${prefix}.${key}` : key;
      return collectKeys(nested, path);
    }
  );
}

describe('message catalogs', () => {
  it('keeps the same keys in en, fr and ar', () => {
    const enKeys = collectKeys(en).sort();
    const frKeys = collectKeys(fr).sort();
    const arKeys = collectKeys(ar).sort();

    expect(frKeys).toEqual(enKeys);
    expect(arKeys).toEqual(enKeys);
  });
});
