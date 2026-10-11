import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { buttonVariants } from '@/components/ui/button-variants';
import { landingStructure } from '@/content/landing-structure';
import { cn } from '@/lib/utils';

export async function Hero() {
  const t = await getTranslations('Landing.hero');
  const { hero } = landingStructure;

  return (
    <section className="relative isolate min-h-svh overflow-hidden">
      <Image
        src={hero.image.src}
        alt={t('imageAlt')}
        fill
        priority
        sizes="100vw"
        className="animate-ken object-cover"
      />
      <div className="absolute inset-0 bg-linear-to-t from-[oklch(0.18_0.04_160)] via-[oklch(0.22_0.035_160_/0.72)] to-[oklch(0.28_0.03_160_/0.35)]" />

      <div className="relative mx-auto flex min-h-svh w-full max-w-6xl flex-col justify-end px-6 pb-16 pt-28 sm:px-8 sm:pb-24">
        <p className="font-display animate-rise text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl">
          {t('brand')}
        </p>
        <h1 className="animate-rise animate-delay-100 mt-4 max-w-2xl text-3xl font-medium tracking-tight text-white sm:text-4xl md:text-5xl">
          {t('title')}
        </h1>
        <p className="animate-rise animate-delay-200 mt-4 max-w-xl text-base text-white/85 sm:text-lg">
          {t('description')}
        </p>
        <div className="animate-rise animate-delay-300 mt-8 flex flex-wrap items-center gap-3">
          <a
            href={hero.primaryCtaHref}
            className={cn(
              buttonVariants({ size: 'lg' }),
              'bg-white px-5 text-primary hover:bg-white/90'
            )}
          >
            {t('primaryCta')}
          </a>
          <a
            href={hero.secondaryCtaHref}
            className={cn(
              buttonVariants({ size: 'lg', variant: 'outline' }),
              'border-white/40 bg-transparent px-5 text-white hover:bg-white/10 hover:text-white'
            )}
          >
            {t('secondaryCta')}
          </a>
        </div>
      </div>
    </section>
  );
}
