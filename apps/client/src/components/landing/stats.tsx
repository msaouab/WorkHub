'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState, type RefObject } from 'react';
import {
  LandingItemText,
  LandingSection,
  LandingSectionBody,
  LandingSectionHeader,
} from '@/components/landing/section';
import {
  formatLandingStat,
  landingStructure,
  type LandingStatMetric,
} from '@/content/landing-structure';

const COUNT_DURATION_MS = 1100;

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      return;
    }

    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  return reduced;
}

function useInViewOnce<T extends Element>(ref: RefObject<T | null>): boolean {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) {
      return;
    }

    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4, rootMargin: '0px 0px -8% 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, inView]);

  return inView;
}

function StatValue({
  stat,
  label,
  suffix,
  delayMs,
}: {
  stat: LandingStatMetric;
  label: string;
  suffix: string;
  delayMs: number;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const inView = useInViewOnce(ref);
  const reducedMotion = usePrefersReducedMotion();
  const [count, setCount] = useState(0);
  const display = formatLandingStat({
    prefix: stat.prefix,
    target: count,
    suffix,
  });

  useEffect(() => {
    if (!inView) {
      return;
    }

    if (reducedMotion) {
      setCount(stat.target);
      return;
    }

    let frame = 0;
    let startAt: number | null = null;
    const delay = delayMs;

    const tick = (now: number) => {
      if (startAt === null) {
        startAt = now + delay;
      }

      if (now < startAt) {
        frame = requestAnimationFrame(tick);
        return;
      }

      const progress = Math.min(1, (now - startAt) / COUNT_DURATION_MS);
      setCount(Math.round(easeOutCubic(progress) * stat.target));

      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [delayMs, inView, reducedMotion, stat.target]);

  return (
    <p
      ref={ref}
      className="font-display text-4xl font-semibold tracking-tight text-primary tabular-nums sm:text-5xl"
      aria-label={`${formatLandingStat({ ...stat, suffix })}: ${label}`}
    >
      <span aria-hidden="true">{display}</span>
    </p>
  );
}

export function Stats() {
  const t = useTranslations('Landing.stats');

  return (
    <LandingSection aria-labelledby="landing-stats-title" tone="muted">
      <LandingSectionHeader
        id="landing-stats-title"
        tone="muted"
        title={t('title')}
        description={t('description')}
      />

      <LandingSectionBody tone="muted">
        <dl className="grid gap-10 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-12 lg:grid-cols-3">
          {landingStructure.stats.items.map((stat, index) => {
            const label = t(`items.${stat.id}`);
            const suffix = t(`suffixes.${stat.id}`);
            return (
              <div key={stat.id} className="max-w-xs">
                <dt className="sr-only">{label}</dt>
                <dd>
                  <StatValue
                    stat={stat}
                    label={label}
                    suffix={suffix}
                    delayMs={index * 100}
                  />
                  <LandingItemText tone="muted">{label}</LandingItemText>
                </dd>
              </div>
            );
          })}
        </dl>
      </LandingSectionBody>
    </LandingSection>
  );
}
