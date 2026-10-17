'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSpaces } from '@/hooks/use-spaces';
import { useRouter } from '@/i18n/navigation';
import { resolvePostAuthPath } from '@/lib/post-auth-path';

/**
 * Runs only when `?land=1` (right after sign-in / proxy guest redirect).
 * Ordinary visits to /dashboard stay on the hub (WH-052).
 */
export function PostAuthRedirect() {
  const searchParams = useSearchParams();
  const shouldLand = searchParams.get('land') === '1';
  const { data: spaces, isPending, isError } = useSpaces();
  const router = useRouter();

  useEffect(() => {
    if (!shouldLand || isPending || isError || !spaces) {
      return;
    }
    router.replace(resolvePostAuthPath(spaces));
  }, [shouldLand, spaces, isPending, isError, router]);

  return null;
}
