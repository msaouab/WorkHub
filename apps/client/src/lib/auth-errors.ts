/** Normalize Better Auth client errors into a single form message. */
export function authErrorMessage(
  error: { message?: string; status?: number; statusText?: string } | null | undefined,
  fallback = 'Something went wrong. Try again.'
): string {
  if (!error) {
    return fallback;
  }
  if (error.status === 429) {
    return 'Too many attempts. Wait a minute and try again.';
  }
  if (error.message?.trim()) {
    return error.message;
  }
  if (error.statusText?.trim()) {
    return error.statusText;
  }
  return fallback;
}
