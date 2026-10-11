import { getTranslations } from 'next-intl/server';
import { buttonVariants } from '@/components/ui/button-variants';
import {
  LandingSection,
  LandingSectionHeader,
} from '@/components/landing/section';
import { landingStructure } from '@/content/landing-structure';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

export async function FinalCta() {
  const t = await getTranslations('Landing.cta');

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
        title={t('title')}
        description={t('description')}
      />
      <div className="mt-10 flex flex-wrap items-center gap-3">
        <Link
          href={landingStructure.cta.primaryCtaHref}
          className={cn(buttonVariants({ size: 'lg' }), 'px-6')}
        >
          {t('primaryCta')}
        </Link>
        <a
          href={landingStructure.cta.secondaryCtaHref}
          className={cn(
            buttonVariants({ size: 'lg', variant: 'outline' }),
            'px-6'
          )}
        >
          {t('secondaryCta')}
        </a>
      </div>
    </LandingSection>
  );
}
