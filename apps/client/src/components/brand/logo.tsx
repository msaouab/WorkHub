'use client';

import { useTranslations } from 'next-intl';
import {
  MARK_NODE_RADIUS,
  MARK_NODES,
  MARK_PATH,
  MARK_STROKE_WIDTH,
  MARK_TILE_RADIUS,
  MARK_TONE,
  MARK_VIEWBOX,
  type LogoTone,
} from '@/components/brand/logo-geometry';
import { cn } from '@/lib/utils';

export type { LogoTone };

type LogoMarkProps = {
  tone?: LogoTone;
  className?: string;
  /** Accessible name. Omit when the mark sits next to visible brand text. */
  title?: string;
};

/** Hub monogram: a W drawn through connected nodes (geometry in logo-geometry.ts). */
export function LogoMark({ tone = 'default', className, title }: LogoMarkProps) {
  const colors = MARK_TONE[tone];

  return (
    <svg
      viewBox={MARK_VIEWBOX}
      xmlns="http://www.w3.org/2000/svg"
      className={cn('size-8 shrink-0', className)}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <rect width="64" height="64" rx={MARK_TILE_RADIUS} className={colors.tile} />
      <path
        d={MARK_PATH}
        fill="none"
        strokeWidth={MARK_STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={colors.line}
      />
      {MARK_NODES.map((node) => (
        <circle
          key={`${node.cx}-${node.cy}`}
          cx={node.cx}
          cy={node.cy}
          r={MARK_NODE_RADIUS}
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
