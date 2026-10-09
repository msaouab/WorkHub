import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button-variants';
import {
  LandingSection,
  LandingSectionHeader,
} from '@/components/landing/section';
import { landingPage } from '@/content/landing';
import { cn } from '@/lib/utils';

export function FinalCta() {
  const { cta } = landingPage;

  return (
    <LandingSection
      id="cta"
      tone="soft"
      backdrop={
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,oklch(0.9_0.04_145),transparent_45%),radial-gradient(circle_at_80%_70%,oklch(0.93_0.03_100),transparent_40%)]"
        />
      }
    >
      <LandingSectionHeader
        tone="soft"
        title={cta.title}
        description={cta.description}
      />
      <div className="mt-10 flex flex-wrap items-center gap-3">
        <Link
          href={cta.primaryCta.href}
          className={cn(buttonVariants({ size: 'lg' }), 'px-6')}
        >
          {cta.primaryCta.label}
        </Link>
        <Link
          href={cta.secondaryCta.href}
          className={cn(
            buttonVariants({ size: 'lg', variant: 'outline' }),
            'px-6'
          )}
        >
          {cta.secondaryCta.label}
        </Link>
      </div>
    </LandingSection>
  );
}
