import { z } from 'zod';

/** URL slug: lowercase letters, digits, single hyphens; 2–48 chars. */
export const spaceSlugSchema = z
  .string()
  .min(2)
  .max(48)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Slug must be lowercase letters, numbers, and hyphens'
  );

export const membershipStatusSchema = z.enum(['active', 'deactivated']);

export const createSpaceSchema = z.strictObject({
  name: z.string().trim().min(1).max(80),
  slug: spaceSlugSchema,
});
export type CreateSpace = z.infer<typeof createSpaceSchema>;

export const spaceRoleSchema = z.object({
  name: z.string(),
  permissions: z.array(z.string()),
});
export type SpaceRole = z.infer<typeof spaceRoleSchema>;

/** POST /spaces and GET /spaces/:spaceId */
export const spaceResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  role: spaceRoleSchema,
  membershipStatus: membershipStatusSchema,
});
export type SpaceResponse = z.infer<typeof spaceResponseSchema>;

/** One row in GET /me/spaces */
export const meSpaceSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  roleName: z.string(),
  membershipStatus: membershipStatusSchema,
});
export type MeSpace = z.infer<typeof meSpaceSchema>;

export const meSpacesResponseSchema = z.array(meSpaceSchema);
export type MeSpacesResponse = z.infer<typeof meSpacesResponseSchema>;
