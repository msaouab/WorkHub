'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchSpaceMembers } from '@/lib/api/members';
import { queryKeys } from '@/lib/api/query-keys';

/** Cursor-paginated workspace members with optional search (WH-016). */
export function useMembers(spaceId: string | undefined, q = '') {
  return useInfiniteQuery({
    queryKey: queryKeys.members.list(spaceId ?? '', q),
    queryFn: ({ pageParam }) =>
      fetchSpaceMembers(spaceId!, {
        cursor: pageParam,
        limit: 20,
        q: q || undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: Boolean(spaceId),
  });
}
