import { Logo } from '@/components/brand/logo';
import { site } from '@/content/site';

export function SiteFooter() {
  return (
    <footer className="border-t border-border px-6 py-10 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Logo className="text-base" markClassName="size-7" />
        <p className="text-sm text-muted-foreground">{site.footer.tagline}</p>
      </div>
    </footer>
  );
}
