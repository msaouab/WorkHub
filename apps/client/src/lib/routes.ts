/** App path segments (no locale prefix). Used by proxy, forms, and nav. */
export const ROUTES = {
  dashboard: '/dashboard',
  settings: '/settings',
  spaces: '/spaces',
  spacesNew: '/spaces/new',
  /** Prefix for `/{locale}/s/{slug}` workspace pages. */
  space: '/s',
  signIn: '/sign-in',
  signUp: '/sign-up',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  verifyEmail: '/verify-email',
  contact: '/contact',
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
