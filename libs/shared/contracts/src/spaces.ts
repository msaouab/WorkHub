import { COVER_PRESETS } from '@work-hub/constants';
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
export type MembershipStatus = z.infer<typeof membershipStatusSchema>;

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

export const spaceLogoSchema = z.object({
  url64: z.string().url(),
  url256: z.string().url(),
});
export type SpaceLogo = z.infer<typeof spaceLogoSchema>;

export const spaceCoverSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('preset'),
    preset: z.enum(COVER_PRESETS),
  }),
  z.object({
    kind: z.literal('image'),
    url1600: z.string().url(),
    url3200: z.string().url(),
  }),
]);
export type SpaceCover = z.infer<typeof spaceCoverSchema>;

const brandingFields = {
  logo: spaceLogoSchema.nullable(),
  cover: spaceCoverSchema.nullable(),
  coverPositionY: z.number().int().min(0).max(100),
};

/** POST /spaces and GET /spaces/:spaceId */
export const spaceResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  role: spaceRoleSchema,
  membershipStatus: membershipStatusSchema,
  ...brandingFields,
});
export type SpaceResponse = z.infer<typeof spaceResponseSchema>;

/** One row in GET /me/spaces */
export const meSpaceSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  roleName: z.string(),
  permissions: z.array(z.string()),
  membershipStatus: membershipStatusSchema,
  ...brandingFields,
});
export type MeSpace = z.infer<typeof meSpaceSchema>;

export const meSpacesResponseSchema = z.array(meSpaceSchema);
export type MeSpacesResponse = z.infer<typeof meSpacesResponseSchema>;

export const patchSpaceCoverSchema = z
  .strictObject({
    preset: z.enum(COVER_PRESETS).nullable().optional(),
    positionY: z.number().int().min(0).max(100).optional(),
  })
  .refine(
    (value) => value.preset !== undefined || value.positionY !== undefined,
    { message: 'Provide preset and/or positionY' }
  );
export type PatchSpaceCover = z.infer<typeof patchSpaceCoverSchema>;
