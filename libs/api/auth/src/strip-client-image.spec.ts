import { describe, expect, it } from 'vitest';
import { stripClientImageUpdate } from './strip-client-image';

describe('stripClientImageUpdate', () => {
  it('removes image from update payloads', () => {
    expect(
      stripClientImageUpdate({
        name: 'Ali',
        image: 'https://evil.example/x.png',
      })
    ).toEqual({ name: 'Ali' });
  });

  it('leaves payloads without image unchanged', () => {
    const input = { name: 'Ali' };
    expect(stripClientImageUpdate(input)).toBe(input);
  });
});
