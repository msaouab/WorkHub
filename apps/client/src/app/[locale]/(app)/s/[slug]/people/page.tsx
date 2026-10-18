import { permanentRedirect } from 'next/navigation';

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

/** People moved to Team → Members (WH-073). */
export default async function Page({ params }: PageProps) {
  const { locale, slug } = await params;
  permanentRedirect(`/${locale}/s/${slug}/team?tab=members`);
}
