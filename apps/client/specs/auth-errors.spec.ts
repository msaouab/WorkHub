import { describe, expect, it } from 'vitest';
import { authErrorKey, authErrorMessage } from '../src/lib/auth-errors';

const messages = {
  INVALID_EMAIL_OR_PASSWORD: 'Invalid email or password',
  EMAIL_NOT_VERIFIED: 'Email not verified',
  USER_ALREADY_EXISTS: 'Account already exists',
  PASSWORD_TOO_SHORT: 'Password is too short',
  INVALID_TOKEN: 'Invalid or expired link',
  TOO_MANY_REQUESTS: 'Too many attempts',
  fallback: 'Something went wrong',
} as const;

const t = (key: keyof typeof messages) => messages[key];

describe('authErrorKey', () => {
  it('maps known codes', () => {
    expect(authErrorKey({ code: 'INVALID_EMAIL_OR_PASSWORD' })).toBe(
      'INVALID_EMAIL_OR_PASSWORD'
    );
    expect(authErrorKey({ code: 'EMAIL_NOT_VERIFIED' })).toBe(
      'EMAIL_NOT_VERIFIED'
    );
    expect(authErrorKey({ code: 'USER_ALREADY_EXISTS' })).toBe(
      'USER_ALREADY_EXISTS'
    );
  });

  it('maps 429 to TOO_MANY_REQUESTS', () => {
    expect(authErrorKey({ status: 429 })).toBe('TOO_MANY_REQUESTS');
  });

  it('falls back for unknown codes and empty errors', () => {
    expect(authErrorKey({ code: 'SOMETHING_NEW', message: 'raw' })).toBe(
      'fallback'
    );
    expect(authErrorKey(null)).toBe('fallback');
    expect(authErrorKey(undefined)).toBe('fallback');
  });
});

describe('authErrorMessage', () => {
  it('never returns the server raw message', () => {
    expect(
      authErrorMessage(
        { code: 'UNKNOWN', message: 'Internal prisma dump' },
        t
      )
    ).toBe('Something went wrong');
    expect(
      authErrorMessage({ code: 'INVALID_EMAIL_OR_PASSWORD' }, t)
    ).toBe('Invalid email or password');
  });
});
