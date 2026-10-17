import type { ReactNode } from 'react';
import { SettingsShell } from '@/components/shell/settings-shell';

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return <SettingsShell>{children}</SettingsShell>;
}
