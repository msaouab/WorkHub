import {
  acceptInviteResponseSchema,
  createSpaceEmailInvitesResponseSchema,
  createSpaceInviteResponseSchema,
  invitePreviewSchema,
  listSpaceInvitesResponseSchema,
  spaceInviteSchema,
  type AcceptInviteResponse,
  type CreateSpaceEmailInvitesResponse,
  type CreateSpaceInvite,
  type CreateSpaceInviteResponse,
  type InvitePreview,
  type ListSpaceInvitesQuery,
  type ListSpaceInvitesResponse,
  type SpaceInvite,
} from '@work-hub/contracts';
import { apiFetch } from '@/lib/api/fetch';
export { fetchSpaceRoles } from '@/lib/api/roles';

export async function fetchSpaceInvites(
  spaceId: string,
  query: ListSpaceInvitesQuery = { limit: 20, status: 'pending' }
): Promise<ListSpaceInvitesResponse> {
  const params = new URLSearchParams();
  if (query.cursor) {
    params.set('cursor', query.cursor);
  }
  if (query.limit !== undefined) {
    params.set('limit', String(query.limit));
  }
  if (query.status) {
    params.set('status', query.status);
  }
  const qs = params.toString();
  const data = await apiFetch<unknown>(
    `spaces/${spaceId}/invites${qs ? `?${qs}` : ''}`
  );
  return listSpaceInvitesResponseSchema.parse(data);
}

export async function createSpaceInvite(
  spaceId: string,
  body: CreateSpaceInvite
): Promise<CreateSpaceInviteResponse | CreateSpaceEmailInvitesResponse> {
  const data = await apiFetch<unknown>(`spaces/${spaceId}/invites`, {
    method: 'POST',
    body,
  });
  if (body.kind === 'link') {
    return createSpaceInviteResponseSchema.parse(data);
  }
  return createSpaceEmailInvitesResponseSchema.parse(data);
}

export async function resendSpaceInvite(
  spaceId: string,
  inviteId: string
): Promise<SpaceInvite> {
  const data = await apiFetch<unknown>(
    `spaces/${spaceId}/invites/${inviteId}/resend`,
    { method: 'POST' }
  );
  return spaceInviteSchema.parse(data);
}

export async function revokeSpaceInvite(
  spaceId: string,
  inviteId: string
): Promise<SpaceInvite> {
  const data = await apiFetch<unknown>(
    `spaces/${spaceId}/invites/${inviteId}`,
    { method: 'DELETE' }
  );
  return spaceInviteSchema.parse(data);
}

export async function previewInvite(token: string): Promise<InvitePreview> {
  const data = await apiFetch<unknown>(`invites/${encodeURIComponent(token)}`);
  return invitePreviewSchema.parse(data);
}

export async function acceptInvite(token: string): Promise<AcceptInviteResponse> {
  const data = await apiFetch<unknown>(
    `invites/${encodeURIComponent(token)}/accept`,
    { method: 'POST' }
  );
  return acceptInviteResponseSchema.parse(data);
}
