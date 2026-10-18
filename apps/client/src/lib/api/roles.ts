import {
  listSpaceRolesResponseSchema,
  spaceRoleOptionSchema,
  type CreateSpaceRole,
  type ListSpaceRolesResponse,
  type PatchSpaceRole,
  type SpaceRoleOption,
} from '@work-hub/contracts';
import { apiFetch } from '@/lib/api/fetch';

export async function fetchSpaceRoles(
  spaceId: string
): Promise<ListSpaceRolesResponse> {
  const data = await apiFetch<unknown>(`spaces/${spaceId}/roles`);
  return listSpaceRolesResponseSchema.parse(data);
}

export async function createSpaceRole(
  spaceId: string,
  body: CreateSpaceRole
): Promise<SpaceRoleOption> {
  const data = await apiFetch<unknown>(`spaces/${spaceId}/roles`, {
    method: 'POST',
    body,
  });
  return spaceRoleOptionSchema.parse(data);
}

export async function patchSpaceRole(
  spaceId: string,
  roleId: string,
  body: PatchSpaceRole
): Promise<SpaceRoleOption> {
  const data = await apiFetch<unknown>(`spaces/${spaceId}/roles/${roleId}`, {
    method: 'PATCH',
    body,
  });
  return spaceRoleOptionSchema.parse(data);
}

export async function deleteSpaceRole(
  spaceId: string,
  roleId: string
): Promise<void> {
  await apiFetch<void>(`spaces/${spaceId}/roles/${roleId}`, {
    method: 'DELETE',
  });
}
