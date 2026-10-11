'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchMe } from '@/lib/api/me';
import { authClient } from '@/lib/auth-client';

export function useMe() {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const signedIn = Boolean(session?.user);

  const query = useQuery({
    queryKey: ['me'],
    queryFn: fetchMe,
    enabled: signedIn,
  });

  return {
    ...query,
    sessionPending,
    signedIn,
  };
}
