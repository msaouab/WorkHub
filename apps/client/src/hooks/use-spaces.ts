'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { fetchMeSpaces } from '@/lib/api/spaces';
import { queryKeys } from '@/lib/api/query-keys';

/** Workspaces the signed-in user belongs to (WH-014). */
export function useSpaces() {
  const { isSignedIn } = useAuth();

  return useQuery({
    queryKey: queryKeys.spaces.all,
    queryFn: fetchMeSpaces,
    enabled: isSignedIn,
  });
}
