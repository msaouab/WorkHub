'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { authClient } from '@/lib/auth-client';
import { ROUTES } from '@/lib/routes';

/** Shared across every `useAuth()` call so sign-out and the auth guard agree. */
let signingOut = false;

export function isSigningOutSession() {
  return signingOut;
}

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session, isPending } = authClient.useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const user = session?.user ?? null;

  async function signOut() {
    setIsSigningOut(true);
    signingOut = true;
    try {
      const result = await authClient.signOut();
      if (result.error) {
        return;
      }
      queryClient.clear();
      // One destination only — `useRequireAuth` skips its own redirect while this runs.
      router.replace(ROUTES.signIn);
      router.refresh();
    } finally {
      signingOut = false;
      setIsSigningOut(false);
    }
  }

  return {
    user,
    isSignedIn: Boolean(user),
    isPending,
    isSigningOut,
    signOut,
  };
}
