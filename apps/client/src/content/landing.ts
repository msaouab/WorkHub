/**
 * Landing copy lives here (not in components) so UI stays presentational
 * and strings are ready to swap for next-intl later via stable `id`s.
 */

export type LandingStep = {
  id: 'join' | 'request' | 'decide';
  title: string;
  description: string;
};

export type LandingPillar = {
  id: 'leave-bank' | 'approvals' | 'documents';
  title: string;
  description: string;
};

export type LandingClient = {
  id:
    | 'agency'
    | 'clinic'
    | 'studio'
    | 'retail'
    | 'saas'
    | 'consulting';
  name: string;
};

export type LandingStat = {
  id:
    | 'onboard'
    | 'decision'
    | 'members'
    | 'roles'
    | 'languages'
    | 'place';
  target: number;
  prefix: string;
  suffix: string;
  label: string;
};

export function formatLandingStat(
  stat: Pick<LandingStat, 'prefix' | 'target' | 'suffix'>
): string {
  return `${stat.prefix}${stat.target}${stat.suffix}`;
}

/** Display index as 01, 02, … — derived so reordering stays correct. */
export function formatStepNumber(index: number): string {
  return String(index + 1).padStart(2, '0');
}

export const landingPage = {
  hero: {
    brand: 'WorkHub',
    title: 'Leave and papers, in one place',
    description:
      'One link to join your company, one screen to see who is off, one click to request a day off or a document.',
    image: {
      src: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=2400&q=80',
      alt: 'Bright open office with desks and natural light',
    },
    primaryCta: { label: 'Start your space', href: '#cta' },
    secondaryCta: { label: 'See the product', href: '#product' },
  },
  problem: {
    title: 'Leave still lives in spreadsheets and chat',
    description:
      'Balances drift, approvals get lost, and employees wait days for a salary certificate. WorkHub replaces the scattered trail with one clear path for every request.',
  },
  clients: {
    title: 'Built for teams that outgrew the spreadsheet',
    description:
      'Studios, clinics, agencies, and growing companies across MENA and francophone markets — without a full HRIS.',
    items: [
      { id: 'agency', name: 'Agencies' },
      { id: 'clinic', name: 'Clinics' },
      { id: 'studio', name: 'Studios' },
      { id: 'retail', name: 'Retail' },
      { id: 'saas', name: 'SaaS' },
      { id: 'consulting', name: 'Consulting' },
    ] as const satisfies readonly LandingClient[],
  },
  stats: {
    title: 'Built around clear outcomes',
    description:
      'v1 targets and capacity — sized for small teams, not enterprise sprawl.',
    items: [
      {
        id: 'onboard',
        target: 10,
        prefix: '< ',
        suffix: ' min',
        label: 'to onboard a ~20-person company',
      },
      {
        id: 'decision',
        target: 24,
        prefix: '< ',
        suffix: ' h',
        label: 'median request-to-decision target',
      },
      {
        id: 'members',
        target: 300,
        prefix: '',
        suffix: '+',
        label: 'members supported per company space',
      },
      {
        id: 'roles',
        target: 4,
        prefix: '',
        suffix: '',
        label: 'roles — owner, admin, manager, employee',
      },
      {
        id: 'languages',
        target: 3,
        prefix: '',
        suffix: '',
        label: 'languages for HR papers (AR, FR, EN)',
      },
      {
        id: 'place',
        target: 1,
        prefix: '',
        suffix: ' place',
        label: 'for leave, holidays, and HR papers',
      },
    ] as const satisfies readonly LandingStat[],
  },
  product: {
    title: 'Built for how small teams actually work',
    description:
      'Spaces, invites, leave, holidays, and document requests — scoped by role from day one.',
    pillars: [
      {
        id: 'leave-bank',
        title: 'Leave bank',
        description:
          'Balances by leave type, with team visibility so planning stays honest.',
      },
      {
        id: 'approvals',
        title: 'Approvals with context',
        description:
          'Managers decide with comments and a full audit trail of every change.',
      },
      {
        id: 'documents',
        title: 'HR papers',
        description:
          'Work certificates, salary letters, and payslip copies without email chase.',
      },
    ] as const satisfies readonly LandingPillar[],
  },
  path: {
    title: 'From invite to decision, without the chase',
    steps: [
      {
        id: 'join',
        title: 'Join your space',
        description: 'Invite link, email invite, or verified company domain.',
      },
      {
        id: 'request',
        title: 'Request in one click',
        description:
          'Time off or an HR paper — same clear flow for everyone.',
      },
      {
        id: 'decide',
        title: 'Decide with a trail',
        description:
          'Approve, deny, comment — every decision stays visible.',
      },
    ] as const satisfies readonly LandingStep[],
  },
  cta: {
    title: 'Onboard a 20-person team in under 10 minutes',
    description:
      'WorkHub is built so leave and document requests move inside the product — with a median decision time under 24 hours.',
    primaryCta: { label: 'Talk to us', href: '/contact' },
    secondaryCta: { label: 'Explore features', href: '#product' },
  },
} as const;
