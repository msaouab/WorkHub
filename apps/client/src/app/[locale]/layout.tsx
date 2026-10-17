import '../global.css';
import { type Locale } from '@work-hub/constants';
import { Figtree, IBM_Plex_Sans_Arabic, Syne } from 'next/font/google';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { AppProviders } from '@/components/providers/app-providers';
import { localeDirection, localeFontClass } from '@/i18n/locale';
import { routing } from '@/i18n/routing';

const figtree = Figtree({
  subsets: ['latin'],
  variable: '--font-sans-loaded',
});

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-display-loaded',
});

const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-arabic-loaded',
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type LocaleLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale: rawLocale } = await params;
  if (!hasLocale(routing.locales, rawLocale)) {
    notFound();
  }

  const locale = rawLocale as Locale;
  setRequestLocale(locale);
  const messages = await getMessages();
  const dir = localeDirection(locale);

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${figtree.variable} ${syne.variable} ${plexArabic.variable} font-sans`}
    >
      <body className={localeFontClass(locale)}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AppProviders defaultLocale={locale}>{children}</AppProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
