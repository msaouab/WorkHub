const STORAGE_KEY = 'workhub.lastSpaceSlug';

/** Soft preference for post-sign-in landing (until `lastWorkspaceId` exists). */
export function getLastSpaceSlug(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setLastSpaceSlug(slug: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, slug);
  } catch {
    // private mode / quota — ignore
  }
}
