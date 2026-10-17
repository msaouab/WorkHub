import { describe, expect, it } from 'vitest';
import { uuidv7 } from './uuidv7';

describe('uuidv7', () => {
  it('returns a version-7 UUID string', () => {
    const id = uuidv7();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });
});
