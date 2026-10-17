'use client';

import { useEffect } from 'react';
import { isSigningOutSession, useAuth } from '@/hooks/use-auth';
import { useRouter } from '@/i18n/navigation';
import { ROUTES } from '@/lib/routes';

/** UX guard for signed-in pages. The API still rejects requests with no session. */
export function useRequireAuth() {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (auth.isPending || auth.isSignedIn || isSigningOutSession()) {
      return;
    }
    router.replace(ROUTES.signIn);
  }, [auth.isPending, auth.isSignedIn, router]);

  return auth;
}
