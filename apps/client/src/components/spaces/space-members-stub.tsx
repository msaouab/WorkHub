'use client';

import { useTranslations } from 'next-intl';
import { useCurrentSpace } from '@/hooks/use-space';

/** Placeholder until WH-046 members API ships. */
export function SpaceMembersStub() {
  const t = useTranslations('Spaces.members');
  const { space } = useCurrentSpace();

  return (
    <div className="flex flex-col gap-3">
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        {t('title')}
      </h1>
      <p className="text-muted-foreground">
        {t('comingSoon', { name: space?.name ?? '' })}
      </p>
    </div>
  );
}
