import { getTranslations } from 'next-intl/server';
import {
  LandingSection,
  LandingSectionHeader,
} from '@/components/landing/section';

export async function Problem() {
  const t = await getTranslations('Landing.problem');

  return (
    <LandingSection tone="muted">
      <LandingSectionHeader
        tone="muted"
        title={t('title')}
        description={t('description')}
      />
    </LandingSection>
  );
}
