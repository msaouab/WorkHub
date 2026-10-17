import { PageLoader } from '@/components/brand/logo-loader';

/** Route-level fallback while a page under /[locale] streams in. */
export default function Loading() {
  return <PageLoader />;
}
