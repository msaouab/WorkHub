'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { authClient } from '@/lib/auth-client';

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session, isPending } = authClient.useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const user = session?.user ?? null;

  async function signOut() {
    setIsSigningOut(true);
    try {
      const result = await authClient.signOut();
      if (result.error) {
        return;
      }
      queryClient.clear();
      router.replace('/');
      router.refresh();
    } finally {
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
