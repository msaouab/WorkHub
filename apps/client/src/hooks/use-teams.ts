'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateSpaceTeam, PatchSpaceTeam } from '@work-hub/contracts';
import {
  createSpaceTeam,
  deleteSpaceTeam,
  fetchSpaceTeams,
  patchSpaceTeam,
} from '@/lib/api/teams';
import { queryKeys } from '@/lib/api/query-keys';

export function useSpaceTeams(spaceId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.teams.all(spaceId ?? ''),
    queryFn: () => {
      if (!spaceId) {
        throw new Error('spaceId is required');
      }
      return fetchSpaceTeams(spaceId);
    },
    enabled: Boolean(spaceId),
  });
}

/** Create / update / delete workspace groups (WH-058). */
export function useTeamActions(spaceId: string) {
  const queryClient = useQueryClient();

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.teams.all(spaceId) });

  const create = useMutation({
    mutationFn: (body: CreateSpaceTeam) => createSpaceTeam(spaceId, body),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({
      teamId,
      body,
    }: {
      teamId: string;
      body: PatchSpaceTeam;
    }) => patchSpaceTeam(spaceId, teamId, body),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (teamId: string) => deleteSpaceTeam(spaceId, teamId),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}
