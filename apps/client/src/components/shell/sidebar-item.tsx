'use client';

import type { LucideIcon } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

type SidebarItemProps = {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  collapsed?: boolean;
  onNavigate?: () => void;
};

export function SidebarItem({
  href,
  label,
  icon: Icon,
  active,
  collapsed = false,
  onNavigate,
}: SidebarItemProps) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      title={collapsed ? label : undefined}
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
      {collapsed ? <span className="sr-only">{label}</span> : <span>{label}</span>}
    </Link>
  );
}
