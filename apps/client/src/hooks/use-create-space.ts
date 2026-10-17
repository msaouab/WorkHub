'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateSpace, MeSpace, SpaceResponse } from '@work-hub/contracts';
import { createSpace } from '@/lib/api/spaces';
import { queryKeys } from '@/lib/api/query-keys';

/** Creates a workspace and prepends it to the `useSpaces` cache (WH-041). */
export function useCreateSpace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateSpace) => createSpace(body),
    onSuccess: (space: SpaceResponse) => {
      const row: MeSpace = {
        id: space.id,
        name: space.name,
        slug: space.slug,
        roleName: space.role.name,
        permissions: space.role.permissions,
        membershipStatus: space.membershipStatus,
        logo: space.logo,
        cover: space.cover,
        coverPositionY: space.coverPositionY,
      };
      queryClient.setQueryData<MeSpace[]>(queryKeys.spaces.all, (prev) =>
        prev ? [row, ...prev.filter((s) => s.id !== row.id)] : [row]
      );
    },
  });
}
