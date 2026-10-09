import {
  LandingSection,
  LandingSectionHeader,
} from '@/components/landing/section';
import { landingPage } from '@/content/landing';

export function Problem() {
  const { problem } = landingPage;

  return (
    <LandingSection tone="muted">
      <LandingSectionHeader
        tone="muted"
        title={problem.title}
        description={problem.description}
      />
    </LandingSection>
  );
}
