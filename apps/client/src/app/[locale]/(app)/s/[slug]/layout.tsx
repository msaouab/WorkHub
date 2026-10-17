import { cookies } from 'next/headers';
import type { ReactNode } from 'react';
import { SpaceShell } from '@/components/shell/space-shell';
import {
  SIDEBAR_COOKIE,
  isSidebarCollapsedCookie,
} from '@/lib/sidebar-cookie';

type LayoutProps = {
  children: ReactNode;
};

export default async function SpaceLayout({ children }: LayoutProps) {
  const jar = await cookies();
  const initialCollapsed = isSidebarCollapsedCookie(
    jar.get(SIDEBAR_COOKIE)?.value
  );

  return (
    <SpaceShell initialCollapsed={initialCollapsed}>{children}</SpaceShell>
  );
}
