'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { fetchMe } from '@/lib/api/me';
import { queryKeys } from '@/lib/api/query-keys';

export function useMe() {
  const { isSignedIn } = useAuth();

  return useQuery({
    queryKey: queryKeys.me,
    queryFn: fetchMe,
    enabled: isSignedIn,
  });
}
