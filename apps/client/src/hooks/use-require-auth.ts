'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from '@/i18n/navigation';

/** UX guard for signed-in pages. The API still rejects requests with no session. */
export function useRequireAuth() {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!auth.isPending && !auth.isSignedIn) {
      router.replace('/sign-in');
    }
  }, [auth.isPending, auth.isSignedIn, router]);

  return auth;
}
