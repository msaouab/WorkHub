import { getTranslations } from 'next-intl/server';
import {
  LandingItemText,
  LandingItemTitle,
  LandingSection,
  LandingSectionBody,
  LandingSectionHeader,
} from '@/components/landing/section';
import {
  formatStepNumber,
  landingStructure,
} from '@/content/landing-structure';

export async function Path() {
  const t = await getTranslations('Landing.path');

  return (
    <LandingSection aria-labelledby="landing-path-title" tone="inverse">
      <LandingSectionHeader
        id="landing-path-title"
        tone="inverse"
        title={t('title')}
      />

      <LandingSectionBody tone="inverse">
        <ol className="grid gap-10 sm:grid-cols-3 sm:gap-8">
          {landingStructure.path.stepIds.map((id, index) => (
            <li key={id}>
              <p
                aria-hidden
                className="font-display text-sm tracking-[0.2em] text-primary-foreground/60"
              >
                {formatStepNumber(index)}
              </p>
              <LandingItemTitle className="mt-3">
                {t(`steps.${id}.title`)}
              </LandingItemTitle>
              <LandingItemText tone="inverse">
                {t(`steps.${id}.description`)}
              </LandingItemText>
            </li>
          ))}
        </ol>
      </LandingSectionBody>
    </LandingSection>
  );
}
