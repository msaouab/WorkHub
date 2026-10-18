import { permanentRedirect } from 'next/navigation';

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

/** Teams/groups live under Team → Groups (WH-073). */
export default async function Page({ params }: PageProps) {
  const { locale, slug } = await params;
  permanentRedirect(`/${locale}/s/${slug}/team?tab=groups`);
}
