import { getTranslations } from 'next-intl/server';
import {
  LandingSection,
  LandingSectionHeader,
} from '@/components/landing/section';
import { landingStructure } from '@/content/landing-structure';

function ClientMarks({ names }: { names: string[] }) {
  return (
    <ul
      className="flex shrink-0 items-center gap-12 px-6 sm:gap-16 sm:px-8"
      aria-hidden
    >
      {names.map((name) => (
        <li
          key={name}
          className="font-display text-xl font-semibold tracking-tight text-foreground/35 whitespace-nowrap sm:text-2xl"
        >
          {name}
        </li>
      ))}
    </ul>
  );
}

export async function Clients() {
  const t = await getTranslations('Landing.clients');
  const itemT = await getTranslations('Landing.clients.items');
  const names = landingStructure.clients.ids.map((id) => itemT(id));

  return (
    <LandingSection
      aria-labelledby="landing-clients-title"
      fullBleed={
        <div className="relative mt-14 overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-linear-to-r from-background to-transparent sm:w-24"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-linear-to-l from-background to-transparent sm:w-24"
          />

          <div className="flex w-max animate-marquee motion-reduce:animate-none">
            <ClientMarks names={names} />
            <ClientMarks names={names} />
          </div>

          <ul className="sr-only">
            {names.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </div>
      }
    >
      <LandingSectionHeader
        id="landing-clients-title"
        title={t('title')}
        description={t('description')}
      />
    </LandingSection>
  );
}
