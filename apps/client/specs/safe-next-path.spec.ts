import { describe, expect, it } from 'vitest';
import { safeNextPath } from '../src/lib/safe-next-path';

describe('safeNextPath', () => {
  it('accepts same-origin relative paths', () => {
    expect(safeNextPath('/invite/tok')).toBe('/invite/tok');
    expect(safeNextPath('/s/acme?tab=1')).toBe('/s/acme?tab=1');
  });

  it('rejects absolute and protocol-relative URLs', () => {
    expect(safeNextPath('https://evil.example')).toBeNull();
    expect(safeNextPath('//evil.example')).toBeNull();
    expect(safeNextPath('\\evil')).toBeNull();
    expect(safeNextPath('invite/tok')).toBeNull();
  });
});
