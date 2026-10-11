import { getTranslations } from 'next-intl/server';
import { AuthNav } from '@/components/auth/auth-nav';
import { Logo } from '@/components/brand/logo';
import { LocaleSwitcher } from '@/components/i18n/locale-switcher';
import { buttonVariants } from '@/components/ui/button-variants';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

export async function SiteHeader() {
  const t = await getTranslations('Site.nav');

  return (
    <header className="absolute inset-x-0 top-0 z-20 animate-fade">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-6 sm:h-20 sm:px-8">
        <Link href="/" className="rounded-lg">
          <Logo tone="inverse" />
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3">
          <a
            href="#product"
            className={cn(
              buttonVariants({ variant: 'ghost' }),
              'hidden text-white/85 hover:bg-white/10 hover:text-white sm:inline-flex'
            )}
          >
            {t('product')}
          </a>
          <LocaleSwitcher tone="inverse" />
          <AuthNav tone="inverse" />
        </nav>
      </div>
    </header>
  );
}
