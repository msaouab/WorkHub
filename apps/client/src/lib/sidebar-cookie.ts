/** Desktop workspace sidebar collapse preference (WH-052). */
export const SIDEBAR_COOKIE = 'wh_sidebar';
export const SIDEBAR_COLLAPSED_VALUE = 'collapsed';

export function isSidebarCollapsedCookie(
  value: string | undefined | null
): boolean {
  return value === SIDEBAR_COLLAPSED_VALUE;
}

/** Client: persist collapse choice (max-age 1 year). */
export function setSidebarCollapsedCookie(collapsed: boolean): void {
  if (typeof document === 'undefined') {
    return;
  }
  const maxAge = 60 * 60 * 24 * 365;
  if (collapsed) {
    document.cookie = `${SIDEBAR_COOKIE}=${SIDEBAR_COLLAPSED_VALUE}; path=/; max-age=${maxAge}; samesite=lax`;
  } else {
    document.cookie = `${SIDEBAR_COOKIE}=; path=/; max-age=0; samesite=lax`;
  }
}
