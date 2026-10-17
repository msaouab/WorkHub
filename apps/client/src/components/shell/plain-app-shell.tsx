import type { ReactNode } from 'react';
import { AppFrame, AppMain } from '@/components/shell/app-frame';

/** Signed-in pages with top bar only (dashboard, spaces picker/create). */
export function PlainAppShell({
  children,
  wide = false,
}: {
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <AppFrame>
      <AppMain wide={wide}>{children}</AppMain>
    </AppFrame>
  );
}
