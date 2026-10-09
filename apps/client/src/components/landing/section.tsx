import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const sectionTone = {
  default: 'border-b border-border/70 bg-background text-foreground',
  muted:
    'border-b border-border/70 bg-[linear-gradient(180deg,oklch(0.97_0.012_100),oklch(0.985_0.008_95))] text-foreground',
  inverse: 'bg-primary text-primary-foreground',
  soft: 'overflow-hidden border-b border-border/70 bg-background text-foreground',
} as const;

const bodyBorder = {
  default: 'border-border',
  muted: 'border-border',
  inverse: 'border-primary-foreground/20',
  soft: 'border-border',
} as const;

const descriptionTone = {
  default: 'text-muted-foreground',
  muted: 'text-muted-foreground',
  inverse: 'text-primary-foreground/80',
  soft: 'text-muted-foreground',
} as const;

export type LandingSectionTone = keyof typeof sectionTone;

type LandingSectionProps = {
  id?: string;
  'aria-labelledby'?: string;
  tone?: LandingSectionTone;
  className?: string;
  children: ReactNode;
  /** Decorative layer behind the content (gradients, patterns). */
  backdrop?: ReactNode;
  /** Full-bleed content below the max-width container (e.g. marquees). */
  fullBleed?: ReactNode;
};

export function LandingSection({
  id,
  'aria-labelledby': ariaLabelledby,
  tone = 'default',
  className,
  children,
  backdrop,
  fullBleed,
}: LandingSectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={ariaLabelledby}
      className={cn(
        'relative px-6 py-20 sm:px-8 sm:py-28',
        sectionTone[tone],
        className
      )}
    >
      {backdrop}
      <div
        className={cn(
          'relative mx-auto max-w-6xl',
          backdrop ? 'z-10' : undefined
        )}
      >
        {children}
      </div>
      {fullBleed}
    </section>
  );
}

type LandingSectionHeaderProps = {
  id?: string;
  title: string;
  description?: string;
  align?: 'start' | 'center';
  tone?: LandingSectionTone;
  className?: string;
};

export function LandingSectionHeader({
  id,
  title,
  description,
  align = 'start',
  tone = 'default',
  className,
}: LandingSectionHeaderProps) {
  return (
    <div
      className={cn(
        'max-w-2xl',
        align === 'center' && 'mx-auto text-center',
        className
      )}
    >
      <h2
        id={id}
        className="font-display text-3xl font-semibold tracking-tight sm:text-4xl"
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            'mt-4 text-lg leading-relaxed',
            descriptionTone[tone]
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}

type LandingSectionBodyProps = {
  tone?: LandingSectionTone;
  className?: string;
  children: ReactNode;
};

export function LandingSectionBody({
  tone = 'default',
  className,
  children,
}: LandingSectionBodyProps) {
  return (
    <div
      className={cn(
        'mt-14 border-t pt-10',
        bodyBorder[tone],
        className
      )}
    >
      {children}
    </div>
  );
}

type LandingItemTitleProps = {
  children: ReactNode;
  className?: string;
};

export function LandingItemTitle({
  children,
  className,
}: LandingItemTitleProps) {
  return (
    <h3
      className={cn(
        'font-display text-xl font-semibold tracking-tight sm:text-2xl',
        className
      )}
    >
      {children}
    </h3>
  );
}

type LandingItemTextProps = {
  tone?: LandingSectionTone;
  children: ReactNode;
  className?: string;
};

export function LandingItemText({
  tone = 'default',
  children,
  className,
}: LandingItemTextProps) {
  return (
    <p
      className={cn(
        'mt-3 text-base leading-relaxed',
        descriptionTone[tone],
        className
      )}
    >
      {children}
    </p>
  );
}
