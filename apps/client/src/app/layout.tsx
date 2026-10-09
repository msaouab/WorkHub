import './global.css';
import { Geist } from 'next/font/google';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { AppProviders } from '@/components/providers/app-providers';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

export const metadata = {
  title: 'WorkHub',
  description:
    'Leave, holidays, and HR document requests for small and mid-size companies.',
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" dir="ltr" className={cn('font-sans', geist.variable)}>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
