import {
  listSpaceTeamsResponseSchema,
  spaceTeamSchema,
  type CreateSpaceTeam,
  type ListSpaceTeamsResponse,
  type PatchSpaceTeam,
  type SpaceTeam,
} from '@work-hub/contracts';
import { apiFetch } from '@/lib/api/fetch';

export async function fetchSpaceTeams(
  spaceId: string
): Promise<ListSpaceTeamsResponse> {
  const data = await apiFetch<unknown>(`spaces/${spaceId}/teams`);
  return listSpaceTeamsResponseSchema.parse(data);
}

export async function createSpaceTeam(
  spaceId: string,
  body: CreateSpaceTeam
): Promise<SpaceTeam> {
  const data = await apiFetch<unknown>(`spaces/${spaceId}/teams`, {
    method: 'POST',
    body,
  });
  return spaceTeamSchema.parse(data);
}

export async function patchSpaceTeam(
  spaceId: string,
  teamId: string,
  body: PatchSpaceTeam
): Promise<SpaceTeam> {
  const data = await apiFetch<unknown>(`spaces/${spaceId}/teams/${teamId}`, {
    method: 'PATCH',
    body,
  });
  return spaceTeamSchema.parse(data);
}

export async function deleteSpaceTeam(
  spaceId: string,
  teamId: string
): Promise<void> {
  await apiFetch<void>(`spaces/${spaceId}/teams/${teamId}`, {
    method: 'DELETE',
  });
}
