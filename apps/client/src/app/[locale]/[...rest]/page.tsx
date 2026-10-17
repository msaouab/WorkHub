import { notFound } from 'next/navigation';

/**
 * Catch-all under a locale so unknown paths render `[locale]/not-found.tsx`
 * with HTTP 404 (WH-051). Real routes are more specific and win.
 */
export default function CatchAllLocalePage() {
  notFound();
}
