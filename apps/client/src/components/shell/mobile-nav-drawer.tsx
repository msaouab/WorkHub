'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';

type MobileNavDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
};

export function MobileNavDrawer({
  open,
  onOpenChange,
  title,
  children,
}: MobileNavDrawerProps) {
  const t = useTranslations('Shell');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        side="start"
        className="lg:hidden"
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">
          {t('openMenu')}
        </DialogDescription>
        <div className="flex h-full flex-col overflow-y-auto">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
