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

const SIZE = {
  sm: 'size-6',
  md: 'size-12',
  lg: 'size-16',
} as const;

/** One keyframe per node so each pops in when the drawn line reaches it (see global.css). */
const NODE_ANIMATION = [
  'motion-safe:animate-logo-node-1',
  'motion-safe:animate-logo-node-2',
  'motion-safe:animate-logo-node-3',
] as const;

type LogoLoaderProps = {
  tone?: LogoTone;
  size?: keyof typeof SIZE;
  /** Announced to screen readers. Defaults to the translated "Loading…". */
  label?: string;
  /** Show the label under the mark. Otherwise it is screen-reader only. */
  showLabel?: boolean;
  className?: string;
};

/**
 * Animated hub monogram for loading states: the W draws itself and the nodes pop in.
 * Appears after a short delay so fast loads don't flash, and falls back to a gentle
 * fade when the user prefers reduced motion.
 */
export function LogoLoader({
  tone = 'default',
  size = 'md',
  label,
  showLabel = false,
  className,
}: LogoLoaderProps) {
  const t = useTranslations('Common');
  const colors = MARK_TONE[tone];
  const text = label ?? t('loading');

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'inline-flex animate-logo-appear flex-col items-center gap-3',
        className
      )}
    >
      <svg
        viewBox={MARK_VIEWBOX}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
        focusable="false"
        className={cn(SIZE[size], 'shrink-0 motion-reduce:animate-logo-breathe')}
      >
        <rect width="64" height="64" rx={MARK_TILE_RADIUS} className={colors.tile} />
        <path
          d={MARK_PATH}
          pathLength={100}
          fill="none"
          strokeWidth={MARK_STROKE_WIDTH}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn(colors.line, 'motion-safe:animate-logo-draw')}
        />
        {MARK_NODES.map((node, index) => (
          <circle
            key={`${node.cx}-${node.cy}`}
            cx={node.cx}
            cy={node.cy}
            r={MARK_NODE_RADIUS}
            className={cn(
              colors.node,
              'origin-center [transform-box:fill-box]',
              NODE_ANIMATION[index]
            )}
          />
        ))}
      </svg>
      <span
        className={showLabel ? 'text-sm text-muted-foreground' : 'sr-only'}
      >
        {text}
      </span>
    </div>
  );
}

type PageLoaderProps = {
  label?: string;
  /**
   * `viewport` — full screen (`loading.tsx`).
   * `parent` — centre in the current layout panel (e.g. AppMain).
   */
  fill?: 'viewport' | 'parent';
};

/** Centred loader for route-level and in-app loading states. */
export function PageLoader({ label, fill = 'viewport' }: PageLoaderProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center px-6',
        fill === 'viewport' ? 'min-h-svh' : 'min-h-full flex-1 py-12'
      )}
    >
      <LogoLoader size="lg" showLabel label={label} />
    </div>
  );
}
