'use client';

import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import { useSpaces } from '@/hooks/use-spaces';

/**
 * Resolves one workspace from `GET /me/spaces` by slug (WH-015).
 * Missing slug after a successful load means the user has no access.
 */
export function useSpace(slug: string | undefined) {
  const spaces = useSpaces();
  const space = useMemo(
    () => spaces.data?.find((row) => row.slug === slug) ?? null,
    [spaces.data, slug]
  );

  return {
    ...spaces,
    space,
    /** True once the list finished and the slug is not among memberships. */
    isForbidden:
      Boolean(slug) &&
      !spaces.isPending &&
      !spaces.isError &&
      spaces.data !== undefined &&
      space === null,
  };
}

/** Workspace from the `/s/{slug}` URL segment. */
export function useCurrentSpace() {
  const params = useParams<{ slug?: string }>();
  const slug = typeof params.slug === 'string' ? params.slug : undefined;
  return { slug, ...useSpace(slug) };
}
