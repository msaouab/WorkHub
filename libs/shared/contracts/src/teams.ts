import { z } from 'zod';

/** Person summary on a team (member or manager). */
export const spaceTeamPersonSchema = z
  .object({
    membershipId: z.uuid(),
    userId: z.uuid(),
    name: z.string(),
    email: z.email(),
    image: z.string().nullable(),
  })
  .meta({ id: 'SpaceTeamPerson' });
export type SpaceTeamPerson = z.infer<typeof spaceTeamPersonSchema>;

/** One workspace group (UI: Groups; API: teams) — WH-058. */
export const spaceTeamSchema = z
  .object({
    id: z.uuid(),
    name: z.string(),
    createdAt: z.iso.datetime(),
    members: z.array(spaceTeamPersonSchema),
    managers: z.array(spaceTeamPersonSchema),
  })
  .meta({ id: 'SpaceTeam' });
export type SpaceTeam = z.infer<typeof spaceTeamSchema>;

export const listSpaceTeamsResponseSchema = z
  .object({
    items: z.array(spaceTeamSchema),
  })
  .meta({ id: 'ListSpaceTeamsResponse' });
export type ListSpaceTeamsResponse = z.infer<
  typeof listSpaceTeamsResponseSchema
>;

/**
 * POST /spaces/:spaceId/teams
 * Plain object for createZodDto.
 */
export const createSpaceTeamSchema = z.object({
  name: z.string().trim().min(1).max(100),
  memberIds: z.array(z.uuid()).max(500).optional(),
  managerIds: z.array(z.uuid()).max(100).optional(),
});
export type CreateSpaceTeam = z.infer<typeof createSpaceTeamSchema>;

/**
 * PATCH /spaces/:spaceId/teams/:teamId
 * `memberIds` / `managerIds` replace the full set when present.
 */
export const patchSpaceTeamSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    memberIds: z.array(z.uuid()).max(500).optional(),
    managerIds: z.array(z.uuid()).max(100).optional(),
  })
  .refine(
    (value) =>
      value.name !== undefined ||
      value.memberIds !== undefined ||
      value.managerIds !== undefined,
    { message: 'At least one field is required' }
  );
export type PatchSpaceTeam = z.infer<typeof patchSpaceTeamSchema>;
