import { z } from 'zod';
import { cursorPageSchema } from './pagination';

export const inviteKindSchema = z.enum(['email', 'link']).meta({ id: 'InviteKind' });
export type InviteKind = z.infer<typeof inviteKindSchema>;

export const inviteListStatusSchema = z
  .enum(['pending', 'past', 'all'])
  .meta({ id: 'InviteListStatus' });
export type InviteListStatus = z.infer<typeof inviteListStatusSchema>;

export const inviteCreatedBySchema = z
  .object({
    id: z.uuid(),
    name: z.string(),
  })
  .meta({ id: 'InviteCreatedBy' });
export type InviteCreatedBy = z.infer<typeof inviteCreatedBySchema>;

/** Invite row (list / create / revoke / resend). */
export const spaceInviteSchema = z
  .object({
    id: z.uuid(),
    kind: inviteKindSchema,
    email: z.email().nullable(),
    role: z.object({
      id: z.uuid(),
      name: z.string(),
    }),
    expiresAt: z.iso.datetime(),
    maxUses: z.number().int().positive(),
    uses: z.number().int().nonnegative(),
    revokedAt: z.iso.datetime().nullable(),
    createdAt: z.iso.datetime(),
    createdBy: inviteCreatedBySchema,
  })
  .meta({ id: 'SpaceInvite' });
export type SpaceInvite = z.infer<typeof spaceInviteSchema>;

/**
 * GET /spaces/:spaceId/invites?cursor=&limit=&status=
 * Plain object (no `.meta({ id })`): nestjs-zod rejects named/$ref schemas for query params.
 */
export const listSpaceInvitesQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: inviteListStatusSchema.default('pending'),
});
export type ListSpaceInvitesQuery = z.infer<typeof listSpaceInvitesQuerySchema>;

export const listSpaceInvitesResponseSchema = cursorPageSchema(
  spaceInviteSchema
).meta({ id: 'ListSpaceInvitesResponse' });
export type ListSpaceInvitesResponse = z.infer<
  typeof listSpaceInvitesResponseSchema
>;

export const emailInviteResultStatusSchema = z
  .enum(['created', 'already_member', 'already_invited', 'invalid'])
  .meta({ id: 'EmailInviteResultStatus' });
export type EmailInviteResultStatus = z.infer<
  typeof emailInviteResultStatusSchema
>;

export const emailInviteResultSchema = z
  .object({
    email: z.string(),
    status: emailInviteResultStatusSchema,
    invite: spaceInviteSchema.optional(),
  })
  .meta({ id: 'EmailInviteResult' });
export type EmailInviteResult = z.infer<typeof emailInviteResultSchema>;

export const createSpaceEmailInvitesResponseSchema = z
  .object({
    results: z.array(emailInviteResultSchema),
  })
  .meta({ id: 'CreateSpaceEmailInvitesResponse' });
export type CreateSpaceEmailInvitesResponse = z.infer<
  typeof createSpaceEmailInvitesResponseSchema
>;

/**
 * POST body — single object (not a Zod discriminatedUnion) so nestjs-zod /
 * createZodDto can extend it. Email invites accept `email` and/or `emails`.
 * No `.meta({ id })`: nestjs-zod's OpenAPI cleanup treats the object +
 * superRefine wrapper as two schemas and rejects a shared name.
 */
export const createSpaceInviteSchema = z
  .object({
    kind: inviteKindSchema,
    email: z.email().optional(),
    emails: z.array(z.email()).min(1).max(50).optional(),
    roleId: z.uuid().optional(),
    maxUses: z.coerce.number().int().min(1).max(1000).default(10),
    expiresInDays: z.coerce.number().int().min(1).max(90).default(7),
  })
  .superRefine((value, ctx) => {
    if (value.kind !== 'email') {
      return;
    }
    if (!value.email && (!value.emails || value.emails.length === 0)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Email is required for email invites',
        path: ['email'],
      });
    }
  });
export type CreateSpaceInvite = z.infer<typeof createSpaceInviteSchema>;

/** Create response for link invites (raw token once). */
export const createSpaceInviteResponseSchema = spaceInviteSchema
  .extend({
    token: z.string().min(1).optional(),
    url: z.string().url().optional(),
  })
  .meta({ id: 'CreateSpaceInviteResponse' });
export type CreateSpaceInviteResponse = z.infer<
  typeof createSpaceInviteResponseSchema
>;

export const invitePreviewSchema = z
  .object({
    spaceName: z.string(),
    spaceSlug: z.string(),
    roleName: z.string(),
    kind: inviteKindSchema,
    email: z.email().nullable(),
    expiresAt: z.iso.datetime(),
  })
  .meta({ id: 'InvitePreview' });
export type InvitePreview = z.infer<typeof invitePreviewSchema>;

export const acceptInviteResponseSchema = z
  .object({
    spaceId: z.uuid(),
    spaceSlug: z.string(),
    spaceName: z.string(),
  })
  .meta({ id: 'AcceptInviteResponse' });
export type AcceptInviteResponse = z.infer<typeof acceptInviteResponseSchema>;

/**
 * GET /spaces/:spaceId/roles — workspace roles (WH-011).
 * Includes Owner (read-only in UI). Invite dialog filters Owner client-side.
 */
export const spaceRoleOptionSchema = z
  .object({
    id: z.uuid(),
    name: z.string(),
    permissions: z.array(z.string()),
    isSystem: z.boolean(),
    /** Workspace default invite role (`spaces.default_role_id`). */
    isDefault: z.boolean(),
    memberCount: z.number().int().nonnegative(),
  })
  .meta({ id: 'SpaceRoleOption' });
export type SpaceRoleOption = z.infer<typeof spaceRoleOptionSchema>;

export const listSpaceRolesResponseSchema = z
  .object({
    items: z.array(spaceRoleOptionSchema),
  })
  .meta({ id: 'ListSpaceRolesResponse' });
export type ListSpaceRolesResponse = z.infer<
  typeof listSpaceRolesResponseSchema
>;
