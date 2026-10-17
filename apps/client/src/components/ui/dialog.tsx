'use client';

import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export const Dialog = DialogPrimitive.Root;
export const DialogPortal = DialogPrimitive.Portal;
export const DialogClose = DialogPrimitive.Close;

export function DialogTrigger({
  className,
  ...props
}: DialogPrimitive.Trigger.Props) {
  return (
    <DialogPrimitive.Trigger
      data-slot="dialog-trigger"
      className={cn(className)}
      {...props}
    />
  );
}

export function DialogOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        'fixed inset-0 z-50 bg-black/40 transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0',
        className
      )}
      {...props}
    />
  );
}

type DialogContentProps = DialogPrimitive.Popup.Props & {
  children: ReactNode;
  /** Drawer slides from the logical start side (RTL-aware). Modal is centred. */
  variant?: 'drawer' | 'modal';
  /** Drawer only: which logical edge. */
  side?: 'start' | 'end';
};

export function DialogContent({
  className,
  children,
  variant = 'drawer',
  side = 'start',
  ...props
}: DialogContentProps) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          'fixed z-50 flex flex-col bg-background shadow-lg outline-none',
          variant === 'modal' &&
            'left-1/2 top-1/2 w-[min(28rem,calc(100vw-2rem))] max-h-[min(90vh,40rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border p-5 transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0',
          variant === 'drawer' &&
            cn(
              'inset-y-0 w-[min(20rem,88vw)] transition-transform duration-200',
              'data-ending-style:opacity-100 data-starting-style:opacity-100',
              side === 'start'
                ? 'inset-s-0 data-ending-style:-translate-x-full data-starting-style:-translate-x-full rtl:data-ending-style:translate-x-full rtl:data-starting-style:translate-x-full'
                : 'inset-e-0 data-ending-style:translate-x-full data-starting-style:translate-x-full rtl:data-ending-style:-translate-x-full rtl:data-starting-style:-translate-x-full'
            ),
          className
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Popup>
    </DialogPortal>
  );
}

export function DialogTitle({
  className,
  ...props
}: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn('text-base font-semibold', className)}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}
