import type { ReactNode } from 'react';
import { AppHeader } from '@/components/layout/app-header';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex min-h-svh flex-col">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,oklch(0.92_0.035_145),transparent_45%),radial-gradient(circle_at_90%_100%,oklch(0.94_0.02_100),transparent_40%)]"
      />
      <AppHeader />
      <div className="relative z-10 flex flex-1 items-start justify-center px-(--app-scroll-pad-x) pt-8 pb-(--app-scroll-end) sm:items-center">
        <div className="w-full max-w-md animate-rise rounded-2xl border border-border/80 bg-background/90 p-6 shadow-sm sm:p-8">
          {children}
        </div>
      </div>
    </main>
  );
}
