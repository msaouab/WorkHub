import {
  LandingSection,
  LandingSectionHeader,
} from '@/components/landing/section';
import { landingPage } from '@/content/landing';

function ClientMarks() {
  return (
    <ul
      className="flex shrink-0 items-center gap-12 px-6 sm:gap-16 sm:px-8"
      aria-hidden
    >
      {landingPage.clients.items.map((client) => (
        <li
          key={client.id}
          className="font-display text-xl font-semibold tracking-tight text-foreground/35 whitespace-nowrap sm:text-2xl"
        >
          {client.name}
        </li>
      ))}
    </ul>
  );
}

export function Clients() {
  const { clients } = landingPage;

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
            <ClientMarks />
            <ClientMarks />
          </div>

          <ul className="sr-only">
            {clients.items.map((client) => (
              <li key={client.id}>{client.name}</li>
            ))}
          </ul>
        </div>
      }
    >
      <LandingSectionHeader
        id="landing-clients-title"
        title={clients.title}
        description={clients.description}
      />
    </LandingSection>
  );
}
