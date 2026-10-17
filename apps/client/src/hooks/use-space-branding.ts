'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { MeSpace, PatchSpaceCover, SpaceResponse } from '@work-hub/contracts';
import {
  deleteSpaceCover,
  deleteSpaceLogo,
  patchSpaceCover,
  uploadSpaceCover,
  uploadSpaceLogo,
} from '@/lib/api/spaces';
import { queryKeys } from '@/lib/api/query-keys';

function applyBranding(
  spaces: MeSpace[] | undefined,
  updated: SpaceResponse
): MeSpace[] | undefined {
  if (!spaces) {
    return spaces;
  }
  return spaces.map((row) =>
    row.id === updated.id
      ? {
          ...row,
          logo: updated.logo,
          cover: updated.cover,
          coverPositionY: updated.coverPositionY,
        }
      : row
  );
}

function clearLogo(
  spaces: MeSpace[] | undefined,
  spaceId: string
): MeSpace[] | undefined {
  if (!spaces) {
    return spaces;
  }
  return spaces.map((row) =>
    row.id === spaceId ? { ...row, logo: null } : row
  );
}

function clearCover(
  spaces: MeSpace[] | undefined,
  spaceId: string
): MeSpace[] | undefined {
  if (!spaces) {
    return spaces;
  }
  return spaces.map((row) =>
    row.id === spaceId
      ? { ...row, cover: null, coverPositionY: 50 }
      : row
  );
}

export function useUpdateSpaceLogo(spaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadSpaceLogo(spaceId, file),
    onSuccess: (updated) => {
      queryClient.setQueryData<MeSpace[]>(queryKeys.spaces.all, (prev) =>
        applyBranding(prev, updated)
      );
    },
  });
}

export function useDeleteSpaceLogo(spaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deleteSpaceLogo(spaceId),
    onSuccess: () => {
      queryClient.setQueryData<MeSpace[]>(queryKeys.spaces.all, (prev) =>
        clearLogo(prev, spaceId)
      );
    },
  });
}

export function useUpdateSpaceCover(spaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: File | PatchSpaceCover) =>
      input instanceof File
        ? uploadSpaceCover(spaceId, input)
        : patchSpaceCover(spaceId, input),
    onSuccess: (updated) => {
      queryClient.setQueryData<MeSpace[]>(queryKeys.spaces.all, (prev) =>
        applyBranding(prev, updated)
      );
    },
  });
}

export function useDeleteSpaceCover(spaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deleteSpaceCover(spaceId),
    onSuccess: () => {
      queryClient.setQueryData<MeSpace[]>(queryKeys.spaces.all, (prev) =>
        clearCover(prev, spaceId)
      );
    },
  });
}
