'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { MeSpace } from '@work-hub/contracts';
import { useRouter } from '@/i18n/navigation';
import {
  deactivateMember,
  leaveSpace,
  patchSpaceMember,
  reactivateMember,
  removeMember,
} from '@/lib/api/members';
import { queryKeys } from '@/lib/api/query-keys';
import { ROUTES } from '@/lib/routes';

function invalidateMembers(queryClient: ReturnType<typeof useQueryClient>, spaceId: string) {
  return queryClient.invalidateQueries({
    queryKey: queryKeys.members.all(spaceId),
  });
}

/** Deactivate / reactivate / remove / leave / change role for a workspace. */
export function useMemberActions(spaceId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const deactivate = useMutation({
    mutationFn: (membershipId: string) =>
      deactivateMember(spaceId, membershipId),
    onSuccess: () => invalidateMembers(queryClient, spaceId),
  });

  const reactivate = useMutation({
    mutationFn: (membershipId: string) =>
      reactivateMember(spaceId, membershipId),
    onSuccess: () => invalidateMembers(queryClient, spaceId),
  });

  const remove = useMutation({
    mutationFn: (membershipId: string) => removeMember(spaceId, membershipId),
    onSuccess: () => invalidateMembers(queryClient, spaceId),
  });

  const updateRole = useMutation({
    mutationFn: ({
      membershipId,
      roleId,
    }: {
      membershipId: string;
      roleId: string;
    }) => patchSpaceMember(spaceId, membershipId, { roleId }),
    onSuccess: () => invalidateMembers(queryClient, spaceId),
  });

  const leave = useMutation({
    mutationFn: () => leaveSpace(spaceId),
    onSuccess: () => {
      queryClient.setQueryData<MeSpace[]>(queryKeys.spaces.all, (prev) =>
        prev?.filter((row) => row.id !== spaceId)
      );
      void queryClient.invalidateQueries({ queryKey: queryKeys.spaces.all });
      router.replace(ROUTES.spaces);
    },
  });

  return { deactivate, reactivate, remove, updateRole, leave };
}
