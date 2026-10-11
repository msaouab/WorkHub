/** Languages WorkHub supports (SRS NFR-10). Must match the Prisma `Locale` enum. */
export const LOCALES = ['en', 'ar', 'fr'] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

/** Right-to-left languages: the web app mirrors its layout for these. */
export const RTL_LOCALES: readonly Locale[] = ['ar'];