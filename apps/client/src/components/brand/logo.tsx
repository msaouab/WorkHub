'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

export type LogoTone = 'default' | 'inverse';

/** `inverse` is for dark or photographic backgrounds (e.g. the landing hero). */
const markTone = {
  default: {
    tile: 'fill-brand',
    line: 'stroke-brand-ink',
    node: 'fill-brand-node',
  },
  inverse: {
    tile: 'fill-white',
    line: 'stroke-brand',
    node: 'fill-brand-node-strong',
  },
} as const;

/** Nodes sit on the three top vertices of the W. */
const NODES = [
  { cx: 14, cy: 20 },
  { cx: 32, cy: 28 },
  { cx: 50, cy: 20 },
] as const;

type LogoMarkProps = {
  tone?: LogoTone;
  className?: string;
  /** Accessible name. Omit when the mark sits next to visible brand text. */
  title?: string;
};

/**
 * Hub monogram: a W drawn through connected nodes.
 * Geometry is mirrored in app/icon.svg and public/brand/*.svg — keep them in sync.
 */
export function LogoMark({ tone = 'default', className, title }: LogoMarkProps) {
  const colors = markTone[tone];

  return (
    <svg
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('size-8 shrink-0', className)}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <rect width="64" height="64" rx="15" className={colors.tile} />
      <path
        d="M14 20l9 25 9-17 9 17 9-25"
        fill="none"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={colors.line}
      />
      {NODES.map((node) => (
        <circle
          key={`${node.cx}-${node.cy}`}
          cx={node.cx}
          cy={node.cy}
          r="4.5"
          className={colors.node}
        />
      ))}
    </svg>
  );
}

type LogoProps = {
  tone?: LogoTone;
  className?: string;
  markClassName?: string;
};

/** Mark + wordmark lockup. The visible brand text provides the accessible name. */
export function Logo({ tone = 'default', className, markClassName }: LogoProps) {
  const t = useTranslations('Site');

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2.5 font-display text-lg font-semibold tracking-tight',
        tone === 'inverse' ? 'text-white' : 'text-foreground',
        className
      )}
    >
      <LogoMark tone={tone} className={markClassName} />
      {t('brand')}
    </span>
  );
}
