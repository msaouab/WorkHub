import Link from 'next/link';
import { Logo } from '@/components/brand/logo';
import { buttonVariants } from '@/components/ui/button-variants';
import { site } from '@/content/site';
import { cn } from '@/lib/utils';

export function AppHeader() {
  return (
    <header className="border-b border-border/80 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6 sm:px-8">
        <Link href="/" className="rounded-lg">
          <Logo />
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            href={site.nav.product.href}
            className={cn(
              buttonVariants({ variant: 'ghost' }),
              'hidden sm:inline-flex'
            )}
          >
            {site.nav.product.label}
          </Link>
          <Link
            href={site.nav.contact.href}
            className={cn(buttonVariants({ variant: 'default' }))}
          >
            {site.nav.contact.label}
          </Link>
        </nav>
      </div>
    </header>
  );
}
