import {
  listSpaceMembersResponseSchema,
  spaceMemberSchema,
  type ListSpaceMembersQuery,
  type ListSpaceMembersResponse,
  type SpaceMember,
} from '@work-hub/contracts';
import { apiFetch } from '@/lib/api/fetch';

export async function fetchSpaceMembers(
  spaceId: string,
  query: ListSpaceMembersQuery = { limit: 20 }
): Promise<ListSpaceMembersResponse> {
  const params = new URLSearchParams();
  if (query.cursor) {
    params.set('cursor', query.cursor);
  }
  if (query.limit !== undefined) {
    params.set('limit', String(query.limit));
  }
  if (query.q) {
    params.set('q', query.q);
  }
  const qs = params.toString();
  const data = await apiFetch<unknown>(
    `spaces/${spaceId}/members${qs ? `?${qs}` : ''}`
  );
  return listSpaceMembersResponseSchema.parse(data);
}

export async function deactivateMember(
  spaceId: string,
  membershipId: string
): Promise<SpaceMember> {
  const data = await apiFetch<unknown>(
    `spaces/${spaceId}/members/${membershipId}/deactivate`,
    { method: 'POST' }
  );
  return spaceMemberSchema.parse(data);
}

export async function reactivateMember(
  spaceId: string,
  membershipId: string
): Promise<SpaceMember> {
  const data = await apiFetch<unknown>(
    `spaces/${spaceId}/members/${membershipId}/reactivate`,
    { method: 'POST' }
  );
  return spaceMemberSchema.parse(data);
}

export async function removeMember(
  spaceId: string,
  membershipId: string
): Promise<void> {
  await apiFetch<void>(`spaces/${spaceId}/members/${membershipId}`, {
    method: 'DELETE',
  });
}

export async function leaveSpace(spaceId: string): Promise<void> {
  await apiFetch<void>(`spaces/${spaceId}/members/me`, { method: 'DELETE' });
}
