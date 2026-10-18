'use client';

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type {
  CreateSpaceInvite,
  InviteListStatus,
} from '@work-hub/contracts';
import {
  acceptInvite,
  createSpaceInvite,
  fetchSpaceInvites,
  previewInvite,
  resendSpaceInvite,
  revokeSpaceInvite,
} from '@/lib/api/invites';
import { queryKeys } from '@/lib/api/query-keys';

export { useSpaceRoles } from '@/hooks/use-roles';

/** Cursor-paginated invites for a workspace. */
export function useInvites(
  spaceId: string | undefined,
  status: InviteListStatus = 'pending'
) {
  return useInfiniteQuery({
    queryKey: queryKeys.invites.list(spaceId ?? '', status),
    queryFn: ({ pageParam }) => {
      if (!spaceId) {
        throw new Error('spaceId is required');
      }
      return fetchSpaceInvites(spaceId, {
        cursor: pageParam,
        limit: 20,
        status,
      });
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: Boolean(spaceId),
  });
}

export function useInvitePreview(token: string | undefined) {
  return useQuery({
    queryKey: queryKeys.invites.preview(token ?? ''),
    queryFn: () => {
      if (!token) {
        throw new Error('token is required');
      }
      return previewInvite(token);
    },
    enabled: Boolean(token),
    retry: false,
  });
}

export function useInviteActions(spaceId: string) {
  const queryClient = useQueryClient();

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: queryKeys.invites.all(spaceId),
    });

  const create = useMutation({
    mutationFn: (body: CreateSpaceInvite) => createSpaceInvite(spaceId, body),
    onSuccess: () => invalidate(),
  });

  const revoke = useMutation({
    mutationFn: (inviteId: string) => revokeSpaceInvite(spaceId, inviteId),
    onSuccess: () => invalidate(),
  });

  const resend = useMutation({
    mutationFn: (inviteId: string) => resendSpaceInvite(spaceId, inviteId),
    onSuccess: () => invalidate(),
  });

  return { create, revoke, resend };
}

export function useAcceptInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (token: string) => acceptInvite(token),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.spaces.all });
    },
  });
}
