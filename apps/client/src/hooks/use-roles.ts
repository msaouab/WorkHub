'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateSpaceRole, PatchSpaceRole } from '@work-hub/contracts';
import {
  createSpaceRole,
  deleteSpaceRole,
  fetchSpaceRoles,
  patchSpaceRole,
} from '@/lib/api/roles';
import { queryKeys } from '@/lib/api/query-keys';

export function useSpaceRoles(spaceId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.invites.roles(spaceId ?? ''),
    queryFn: () => {
      if (!spaceId) {
        throw new Error('spaceId is required');
      }
      return fetchSpaceRoles(spaceId);
    },
    enabled: Boolean(spaceId),
  });
}

function invalidateRoles(
  queryClient: ReturnType<typeof useQueryClient>,
  spaceId: string
) {
  return Promise.all([
    queryClient.invalidateQueries({
      queryKey: queryKeys.invites.roles(spaceId),
    }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.members.all(spaceId),
    }),
  ]);
}

/** Create / update / delete custom workspace roles (WH-011). */
export function useRoleActions(spaceId: string) {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: (body: CreateSpaceRole) => createSpaceRole(spaceId, body),
    onSuccess: () => invalidateRoles(queryClient, spaceId),
  });

  const update = useMutation({
    mutationFn: ({
      roleId,
      body,
    }: {
      roleId: string;
      body: PatchSpaceRole;
    }) => patchSpaceRole(spaceId, roleId, body),
    onSuccess: () => invalidateRoles(queryClient, spaceId),
  });

  const remove = useMutation({
    mutationFn: (roleId: string) => deleteSpaceRole(spaceId, roleId),
    onSuccess: () => invalidateRoles(queryClient, spaceId),
  });

  return { create, update, remove };
}
