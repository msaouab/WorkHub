import type { Auth } from '@work-hub/auth';
import type { Locale } from '@work-hub/constants';
import type { PrismaClient } from '@work-hub/database';

/** Reserved .test domain: these addresses can never reach a real inbox. */
export const SEED_EMAIL_DOMAIN = '@workhub.test';

export type SeedUser = {
  name: string;
  email: string;
  locale: Locale;
  verified: boolean;
};

/** One user per language, so LTR (en, fr) and RTL (ar) are both tested from day one. */
export const SEED_USERS: SeedUser[] = [
  { name: 'Olivia Owner', email: `owner${SEED_EMAIL_DOMAIN}`, locale: 'en', verified: true },
  { name: 'Adam Admin', email: `admin${SEED_EMAIL_DOMAIN}`, locale: 'fr', verified: true },
  { name: 'Mia Member', email: `member${SEED_EMAIL_DOMAIN}`, locale: 'ar', verified: true },
  { name: 'Una Unverified', email: `unverified${SEED_EMAIL_DOMAIN}`, locale: 'en', verified: false },
];

export type SeedResult = { email: string; locale: Locale; status: 'created' | 'exists' };

/** Creates missing seed users through Better Auth's real sign-up (same hashing as the app). */
export async function seedUsers(
  auth: Auth,
  prisma: PrismaClient,
  password: string
): Promise<SeedResult[]> {
  const results: SeedResult[] = [];
  for (const user of SEED_USERS) {
    if (await prisma.user.findUnique({ where: { email: user.email } })) {
      results.push({ email: user.email, locale: user.locale, status: 'exists' });
      continue;
    }
    await auth.api.signUpEmail({
      body: { name: user.name, email: user.email, password },
    });
    // Sign-up can't set these (locale is not a sign-up input), so set them directly.
    await prisma.user.update({
      where: { email: user.email },
      data: { emailVerified: user.verified, locale: user.locale },
    });
    results.push({ email: user.email, locale: user.locale, status: 'created' });
  }
  return results;
}

/** Deletes only seed users (sessions and accounts cascade). Never touches real users. */
export async function deleteSeedUsers(prisma: PrismaClient): Promise<number> {
  const { count } = await prisma.user.deleteMany({
    where: { email: { endsWith: SEED_EMAIL_DOMAIN } },
  });
  return count;
}