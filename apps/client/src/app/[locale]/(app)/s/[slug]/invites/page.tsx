import { permanentRedirect } from 'next/navigation';

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

/** Invites moved to Team → Invitations (WH-073). */
export default async function Page({ params }: PageProps) {
  const { locale, slug } = await params;
  permanentRedirect(`/${locale}/s/${slug}/team?tab=invitations`);
}
