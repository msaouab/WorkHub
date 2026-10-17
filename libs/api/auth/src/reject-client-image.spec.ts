import { APIError } from 'better-auth/api';
import { describe, expect, it } from 'vitest';
import { rejectClientImageUpdate } from './reject-client-image';

describe('rejectClientImageUpdate', () => {
  it('throws when the body includes image', () => {
    expect(() =>
      rejectClientImageUpdate({ image: 'https://evil.example/x.png', name: 'A' })
    ).toThrow(APIError);
  });

  it('allows bodies without image', () => {
    expect(() => rejectClientImageUpdate({ name: 'A' })).not.toThrow();
    expect(() => rejectClientImageUpdate(null)).not.toThrow();
  });
});
