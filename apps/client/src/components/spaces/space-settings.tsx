'use client';

import { useTranslations } from 'next-intl';
import { SpaceBranding } from '@/components/spaces/space-branding';
import { useCurrentSpace } from '@/hooks/use-space';

/** Workspace settings content; shell handles access states. */
export function SpaceSettings() {
  const t = useTranslations('Spaces.settings');
  const { space } = useCurrentSpace();

  if (!space) {
    return null;
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-sm text-muted-foreground">{space.name}</p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
          {t('title')}
        </h1>
        <p className="mt-2 text-muted-foreground">{t('description')}</p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{t('brandingTitle')}</h2>
        <p className="text-sm text-muted-foreground">{t('brandingDescription')}</p>
        <SpaceBranding space={space} variant="settings" />
      </section>
    </div>
  );
}
