import Link from 'next/link';
import { Logo } from '@/components/brand/logo';
import { buttonVariants } from '@/components/ui/button-variants';
import { site } from '@/content/site';
import { cn } from '@/lib/utils';

export function SiteHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-20 animate-fade">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6 sm:h-20 sm:px-8">
        <Link href="/" className="rounded-lg">
          <Logo tone="inverse" />
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            href="#product"
            className={cn(
              buttonVariants({ variant: 'ghost' }),
              'hidden text-white/85 hover:bg-white/10 hover:text-white sm:inline-flex'
            )}
          >
            {site.nav.product.label}
          </Link>
          <Link
            href={site.nav.contact.href}
            className={cn(
              buttonVariants({ variant: 'default' }),
              'bg-white text-primary hover:bg-white/90'
            )}
          >
            {site.nav.contact.label}
          </Link>
        </nav>
      </div>
    </header>
  );
}
