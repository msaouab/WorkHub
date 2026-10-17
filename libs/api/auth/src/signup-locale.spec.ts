import { describe, expect, it } from 'vitest';
import {
  localeFromRequestHeaders,
  resolveSignupLocale,
  SIGNUP_LOCALE_HEADER,
} from './signup-locale';

describe('resolveSignupLocale', () => {
  it.each([
    ['en', 'en'],
    ['ar', 'ar'],
    ['fr', 'fr'],
    ['EN', 'en'],
    ['ar-MA', 'ar'],
    ['fr,en;q=0.8', 'fr'],
  ] as const)('maps %j → %j', (raw, expected) => {
    expect(resolveSignupLocale(raw)).toBe(expected);
  });

  it.each([null, undefined, '', 'de', 'zz', 'not-a-locale'])(
    'falls back to en for %j',
    (raw) => {
      expect(resolveSignupLocale(raw)).toBe('en');
    }
  );
});

describe('localeFromRequestHeaders', () => {
  it('prefers x-workhub-locale over Accept-Language', () => {
    const headers = new Headers({
      [SIGNUP_LOCALE_HEADER]: 'ar',
      'accept-language': 'fr',
    });
    expect(localeFromRequestHeaders(headers)).toBe('ar');
  });

  it('uses Accept-Language when the custom header is absent', () => {
    expect(
      localeFromRequestHeaders(new Headers({ 'accept-language': 'fr-FR' }))
    ).toBe('fr');
  });

  it('defaults when headers are missing', () => {
    expect(localeFromRequestHeaders(null)).toBe('en');
  });
});
