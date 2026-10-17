/** Better Auth client error codes we map to translated messages. */
export const AUTH_ERROR_CODES = [
  'INVALID_EMAIL_OR_PASSWORD',
  'EMAIL_NOT_VERIFIED',
  'PASSWORD_TOO_SHORT',
  'INVALID_TOKEN',
  'TOO_MANY_REQUESTS',
] as const;

export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[number];

export type AuthErrorTranslateKey = AuthErrorCode | 'fallback';

export type AuthClientError = {
  code?: string | null;
  message?: string | null;
  status?: number;
  statusText?: string | null;
} | null | undefined;

function isAuthErrorCode(value: string): value is AuthErrorCode {
  return (AUTH_ERROR_CODES as readonly string[]).includes(value);
}

/**
 * Map a Better Auth client error to a translation key under `Auth.errors`.
 * Never returns the server's raw English text.
 */
export function authErrorKey(error: AuthClientError): AuthErrorTranslateKey {
  if (!error) {
    return 'fallback';
  }
  if (error.status === 429) {
    return 'TOO_MANY_REQUESTS';
  }
  if (error.code && isAuthErrorCode(error.code)) {
    return error.code;
  }
  return 'fallback';
}

/** Resolve a Better Auth client error with a next-intl translator for `Auth.errors`. */
export function authErrorMessage(
  error: AuthClientError,
  t: (key: AuthErrorTranslateKey) => string
): string {
  return t(authErrorKey(error));
}
