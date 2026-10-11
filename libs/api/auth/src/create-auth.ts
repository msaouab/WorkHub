import type { PrismaClient } from '@work-hub/database';
import type { MailService } from '@work-hub/mail';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { openAPI } from 'better-auth/plugins';
import { passwordHasher } from './password';

/** Where Better Auth's routes are mounted. Also used to prefix them in Swagger. */
export const AUTH_BASE_PATH = '/api/auth';

export type AuthMailer = Pick<MailService, 'sendVerifyEmail' | 'sendPasswordReset'>;

export type AuthConfig = {
  /** Public URL of this API, e.g. http://localhost:3333 */
  baseUrl: string;
  /** ≥ 32 random characters; signs session cookies and tokens */
  secret: string;
  /** Browser origins allowed to call auth endpoints (CSRF protection) */
  trustedOrigins: string[];
};

/**
 * Better Auth routes we don't expose (they return 404 and are left out of Swagger).
 * Re-enable a route by deleting it here, e.g. the social ones in Step 5.
 */
const DISABLED_PATHS = [
  // Not needed: we sign in with OAuth providers but never call their APIs.
  '/get-access-token',
  '/refresh-token',
  '/account-info',
  '/update-session', // no custom session data
  '/ok', // /health/* covers this
  '/open-api/generate-schema', // Swagger reads it internally
  // Later: Step 5 (OAuth providers)
  '/sign-in/social',
  '/link-social',
  '/unlink-account',
  // Later: needs its own design
  '/change-email', // must verify the new address
  '/delete-user', // GDPR flow (NFR-08)
  '/delete-user/callback',
  '/verify-password', // re-auth for sensitive actions
];

export function createAuth({
  prisma,
  mail,
  config,
}: {
  prisma: PrismaClient;
  mail: AuthMailer;
  config: AuthConfig;
}) {
  return betterAuth({
    appName: 'WorkHub',
    baseURL: config.baseUrl,
    basePath: AUTH_BASE_PATH,
    secret: config.secret,
    trustedOrigins: config.trustedOrigins,
    database: prismaAdapter(prisma, { provider: 'postgresql' }),
    // Prisma generates the ids (@default(uuid(7))), not Better Auth.
    advanced: { database: { generateId: false } },
    user: {
      additionalFields: {
        // Matches the Locale enum; users can't set it at sign-up (yet).
        locale: { type: 'string', defaultValue: 'en', input: false },
      },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true, // FR-AUTH-02
      minPasswordLength: 10,
      password: passwordHasher, // NFR-06
      resetPasswordTokenExpiresIn: 30 * 60, // FR-AUTH-03: 30 minutes
      revokeSessionsOnPasswordReset: true, // a reset signs out every device
      sendResetPassword: async ({ user, url }) => {
        void mail.sendPasswordReset(user.email, user.name, url);
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      expiresIn: 24 * 60 * 60, // matches the "expires in 24 hours" email text
      sendVerificationEmail: async ({ user, url }) => {
        void mail.sendVerifyEmail(user.email, user.name, url);
      },
    },
    session: {
      expiresIn: 7 * 24 * 60 * 60, // 7 days
      updateAge: 24 * 60 * 60, // extend the expiry at most once a day
    },
    rateLimit: {
      enabled: true, // Better Auth only enables it in production by default
      window: 60,
      max: 100,
      customRules: {
        '/sign-in/email': { window: 60, max: 5 }, // NFR-06
        '/sign-up/email': { window: 60, max: 5 },
        '/request-password-reset': { window: 60, max: 3 },
      },
    },
    // Describes the auth routes as OpenAPI; merged into our Swagger page (no separate reference page).
    plugins: [openAPI({ disableDefaultReference: true })],
    disabledPaths: DISABLED_PATHS,
  });
}

export type Auth = ReturnType<typeof createAuth>;
