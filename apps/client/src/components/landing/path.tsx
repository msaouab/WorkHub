import {
  LandingItemText,
  LandingItemTitle,
  LandingSection,
  LandingSectionBody,
  LandingSectionHeader,
} from '@/components/landing/section';
import { formatStepNumber, landingPage } from '@/content/landing';

export function Path() {
  const { path } = landingPage;

  return (
    <LandingSection aria-labelledby="landing-path-title" tone="inverse">
      <LandingSectionHeader
        id="landing-path-title"
        tone="inverse"
        title={path.title}
      />

      <LandingSectionBody tone="inverse">
        <ol className="grid gap-10 sm:grid-cols-3 sm:gap-8">
          {path.steps.map((step, index) => (
            <li key={step.id}>
              <p
                aria-hidden
                className="font-display text-sm tracking-[0.2em] text-primary-foreground/60"
              >
                {formatStepNumber(index)}
              </p>
              <LandingItemTitle className="mt-3">{step.title}</LandingItemTitle>
              <LandingItemText tone="inverse">
                {step.description}
              </LandingItemText>
            </li>
          ))}
        </ol>
      </LandingSectionBody>
    </LandingSection>
  );
}
