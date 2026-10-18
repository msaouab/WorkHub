'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import type { MembershipStatus } from '@work-hub/contracts';
import { fetchSpaceMembers } from '@/lib/api/members';
import { queryKeys } from '@/lib/api/query-keys';

export type MembersListFilters = {
  q?: string;
  status?: MembershipStatus;
  role?: string;
};

/** Cursor-paginated workspace members with optional search/filters. */
export function useMembers(
  spaceId: string | undefined,
  filters: MembersListFilters | string = {}
) {
  const normalized =
    typeof filters === 'string' ? { q: filters } : filters;
  const q = normalized.q ?? '';
  const status = normalized.status ?? '';
  const role = normalized.role ?? '';

  return useInfiniteQuery({
    queryKey: queryKeys.members.list(spaceId ?? '', q, status, role),
    queryFn: ({ pageParam }) => {
      if (!spaceId) {
        throw new Error('spaceId is required');
      }
      return fetchSpaceMembers(spaceId, {
        cursor: pageParam,
        limit: 20,
        q: q || undefined,
        status: normalized.status,
        role: role || undefined,
      });
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: Boolean(spaceId),
  });
}
