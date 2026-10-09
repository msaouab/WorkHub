import './global.css';
import { Figtree, Syne } from 'next/font/google';
import type { ReactNode } from 'react';

const figtree = Figtree({
  subsets: ['latin'],
  variable: '--font-sans-loaded',
});

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-display-loaded',
});

export const metadata = {
  title: 'WorkHub — Leave and papers, in one place',
  description:
    'Multi-tenant leave, holidays, and HR document requests for small and mid-size companies.',
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${figtree.variable} ${syne.variable} font-sans`}
    >
      <body>{children}</body>
    </html>
  );
}
