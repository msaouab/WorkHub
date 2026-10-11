import { getTranslations } from 'next-intl/server';
import { Logo } from '@/components/brand/logo';
import { LocaleSwitcher } from '@/components/i18n/locale-switcher';

export async function SiteFooter() {
  const t = await getTranslations('Site.footer');

  return (
    <footer className="border-t border-border px-6 py-10 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Logo className="text-base" markClassName="size-7" />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <p className="text-sm text-muted-foreground">{t('tagline')}</p>
          <LocaleSwitcher />
        </div>
      </div>
    </footer>
  );
}
