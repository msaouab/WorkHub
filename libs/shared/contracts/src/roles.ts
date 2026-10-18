import { PERMISSION_LIST, type Permission } from '@work-hub/constants';
import { z } from 'zod';

const permissionTuple = PERMISSION_LIST as unknown as [
  Permission,
  ...Permission[],
];
const permissionSchema = z.enum(permissionTuple);

/**
 * POST /spaces/:spaceId/roles — create a custom role (WH-011).
 * Plain object for createZodDto (no `.meta({ id })` on the body schema).
 */
export const createSpaceRoleSchema = z.object({
  name: z.string().trim().min(1).max(100),
  permissions: z.array(permissionSchema).min(1),
  isDefault: z.boolean().optional(),
});
export type CreateSpaceRole = z.infer<typeof createSpaceRoleSchema>;

/**
 * PATCH /spaces/:spaceId/roles/:roleId
 * At least one field required.
 */
export const patchSpaceRoleSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    permissions: z.array(permissionSchema).min(1).optional(),
    isDefault: z.boolean().optional(),
  })
  .refine(
    (value) =>
      value.name !== undefined ||
      value.permissions !== undefined ||
      value.isDefault !== undefined,
    { message: 'At least one field is required' }
  );
export type PatchSpaceRole = z.infer<typeof patchSpaceRoleSchema>;
