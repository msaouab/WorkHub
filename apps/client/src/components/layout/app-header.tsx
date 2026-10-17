import { getTranslations } from 'next-intl/server';
import { AuthNav } from '@/components/auth/auth-nav';
import { Logo } from '@/components/brand/logo';
import { LocaleSwitcher } from '@/components/i18n/locale-switcher';
import { WorkspaceSwitcher } from '@/components/spaces/workspace-switcher';
import { buttonVariants } from '@/components/ui/button-variants';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

type AppHeaderProps = {
  /** Show workspace switcher (signed-in app shell). */
  showWorkspaceSwitcher?: boolean;
};

export async function AppHeader({
  showWorkspaceSwitcher = false,
}: AppHeaderProps) {
  const t = await getTranslations('Site.nav');

  return (
    <header className="border-b border-border/80 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-6 sm:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/" className="rounded-lg">
            <Logo />
          </Link>
          {showWorkspaceSwitcher ? <WorkspaceSwitcher /> : null}
        </div>
        <nav className="flex items-center gap-2">
          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: 'ghost' }),
              'hidden sm:inline-flex'
            )}
          >
            {t('product')}
          </Link>
          <LocaleSwitcher />
          <AuthNav />
        </nav>
      </div>
    </header>
  );
}
