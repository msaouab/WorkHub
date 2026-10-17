import { z } from 'zod';
import { cursorPageSchema } from './pagination';
import { membershipStatusSchema } from './spaces';

/** Role summary on a member row (full permissions live on space access / WH-011). */
export const spaceMemberRoleSchema = z
  .object({
    id: z.uuid(),
    name: z.string(),
  })
  .meta({ id: 'SpaceMemberRole' });
export type SpaceMemberRole = z.infer<typeof spaceMemberRoleSchema>;

/** One membership in GET /spaces/:spaceId/members (and deactivate/reactivate). */
export const spaceMemberSchema = z
  .object({
    id: z.uuid(),
    userId: z.uuid(),
    name: z.string(),
    email: z.email(),
    image: z.string().nullable(),
    role: spaceMemberRoleSchema,
    membershipStatus: membershipStatusSchema,
    createdAt: z.iso.datetime(),
  })
  .meta({ id: 'SpaceMember' });
export type SpaceMember = z.infer<typeof spaceMemberSchema>;

/**
 * GET /spaces/:spaceId/members?cursor=&limit=&q=
 * Plain object (no `.meta({ id })`): nestjs-zod rejects named/$ref schemas for query params.
 */
export const listSpaceMembersQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().min(1).max(100).optional(),
});
export type ListSpaceMembersQuery = z.infer<typeof listSpaceMembersQuerySchema>;

export const listSpaceMembersResponseSchema = cursorPageSchema(
  spaceMemberSchema
).meta({ id: 'ListSpaceMembersResponse' });
export type ListSpaceMembersResponse = z.infer<
  typeof listSpaceMembersResponseSchema
>;
