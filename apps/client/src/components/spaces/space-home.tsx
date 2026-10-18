'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useCurrentSpace } from '@/hooks/use-space';
import { useRoleLabel } from '@/hooks/use-role-label';
import { setLastSpaceSlug } from '@/lib/last-space';

/**
 * Workspace home (WH-052). Branding lives in settings; home will grow into
 * KPIs / charts. Access / paused / loading are handled by SpaceShell.
 */
export function SpaceHome() {
  const t = useTranslations('Spaces.home');
  const tMeta = useTranslations('Metadata');
  const { space } = useCurrentSpace();
  const roleLabel = useRoleLabel(space?.roleName ?? '');

  useEffect(() => {
    if (space) {
      setLastSpaceSlug(space.slug);
      document.title = tMeta('spaceTitle', { name: space.name });
    }
  }, [space, tMeta]);

  if (!space) {
    return null;
  }
  const statusLabel = t(
    `statusValues.${space.membershipStatus}` as 'statusValues.active'
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-muted-foreground">{t('eyebrow')}</p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {space.name}
        </h1>
        <p className="mt-3 text-muted-foreground">
          {t('description', { role: roleLabel })}
        </p>
      </div>

      <dl className="grid gap-3 rounded-xl border border-border/80 bg-background/90 p-5 text-sm">
        <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
          <dt className="text-muted-foreground">{t('slug')}</dt>
          <dd className="font-mono text-foreground">{space.slug}</dd>
        </div>
        <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
          <dt className="text-muted-foreground">{t('role')}</dt>
          <dd className="font-medium text-foreground">{roleLabel}</dd>
        </div>
        <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
          <dt className="text-muted-foreground">{t('status')}</dt>
          <dd className="font-medium text-foreground">{statusLabel}</dd>
        </div>
      </dl>
    </div>
  );
}
