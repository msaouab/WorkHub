import { LOCALES } from '@work-hub/constants';
import { z } from 'zod';

export const localeSchema = z.enum(LOCALES);

/** GET and PATCH /api/v1/me response: public fields only. */
export const meResponseSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  name: z.string(),
  emailVerified: z.boolean(),
  image: z.string().nullable(),
  locale: localeSchema,
});
export type MeResponse = z.infer<typeof meResponseSchema>;

/**
 * PATCH /api/v1/me body. Strict: unknown fields are rejected, not ignored.
 * Name and image are changed through Better Auth's /update-user instead.
 */
export const updateMeSchema = z.strictObject({
  locale: localeSchema,
});
export type UpdateMe = z.infer<typeof updateMeSchema>;