'use client';

import type { LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

type SidebarItemProps = {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  collapsed?: boolean;
  soon?: boolean;
  onNavigate?: () => void;
};

export function SidebarItem({
  href,
  label,
  icon: Icon,
  active,
  collapsed = false,
  soon = false,
  onNavigate,
}: SidebarItemProps) {
  const t = useTranslations('Shell');
  const title = soon
    ? t('soonTitle', { label })
    : collapsed
      ? label
      : undefined;

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      title={title}
      onClick={onNavigate}
      className={cn(
        'group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium outline-none transition-colors',
        'focus-visible:ring-2 focus-visible:ring-ring',
        active
          ? 'bg-accent text-accent-foreground'
          : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
        collapsed && 'justify-center px-2'
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      {collapsed ? (
        <span className="sr-only">{label}</span>
      ) : (
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <span className="truncate">{label}</span>
          {soon ? (
            <span className="ms-auto shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
              {t('soon')}
            </span>
          ) : null}
        </span>
      )}
    </Link>
  );
}
