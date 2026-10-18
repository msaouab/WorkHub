/** Non-translated landing structure (ids, metrics, media, hrefs). */

export type LandingStatId =
  | 'onboard'
  | 'decision'
  | 'members'
  | 'roles'
  | 'languages'
  | 'place';

export type LandingStatMetric = {
  id: LandingStatId;
  target: number;
  prefix: string;
};

export function formatLandingStat(
  stat: Pick<LandingStatMetric, 'prefix' | 'target'> & { suffix: string }
): string {
  return `${stat.prefix}${stat.target}${stat.suffix}`;
}

export function formatStepNumber(index: number): string {
  return String(index + 1).padStart(2, '0');
}

export const landingStructure = {
  hero: {
    image: {
      src: '/hero-office.jpg',
    },
    primaryCtaHref: '#cta',
    secondaryCtaHref: '#product',
  },
  clients: {
    ids: ['agency', 'clinic', 'studio', 'retail', 'saas', 'consulting'] as const,
  },
  stats: {
    items: [
      { id: 'onboard', target: 10, prefix: '< ' },
      { id: 'decision', target: 24, prefix: '< ' },
      { id: 'members', target: 300, prefix: '' },
      { id: 'roles', target: 4, prefix: '' },
      { id: 'languages', target: 3, prefix: '' },
      { id: 'place', target: 1, prefix: '' },
    ] as const satisfies readonly LandingStatMetric[],
  },
  product: {
    pillarIds: ['leave-bank', 'approvals', 'documents'] as const,
  },
  path: {
    stepIds: ['join', 'request', 'decide'] as const,
  },
  cta: {
    primaryCtaHref: '/contact',
    secondaryCtaHref: '#product',
  },
} as const;
