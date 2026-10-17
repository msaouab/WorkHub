'use client';

import { PERMISSIONS } from '@work-hub/constants';
import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/shell/page-header';
import { SpaceBranding } from '@/components/spaces/space-branding';
import { useCan } from '@/hooks/use-can';
import { useCurrentSpace } from '@/hooks/use-space';
import { cn } from '@/lib/utils';

type SectionId = 'general' | 'branding' | 'billing' | 'danger';

/** Workspace settings with in-page section nav (WH-053). */
export function SpaceSettings() {
  const t = useTranslations('Spaces.settings');
  const { space } = useCurrentSpace();
  const canBilling = useCan(PERMISSIONS.SPACE_BILLING_WRITE);
  const canDelete = useCan(PERMISSIONS.SPACE_DELETE);

  if (!space) {
    return null;
  }

  const sections: { id: SectionId; label: string; show: boolean }[] = [
    { id: 'general', label: t('sections.general'), show: true },
    { id: 'branding', label: t('sections.branding'), show: true },
    { id: 'billing', label: t('sections.billing'), show: canBilling },
    { id: 'danger', label: t('sections.danger'), show: canDelete },
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t('title')} description={t('description')} />

      <nav
        aria-label={t('sectionNav')}
        className="flex flex-wrap gap-2 border-b border-border/60 pb-3"
      >
        {sections
          .filter((s) => s.show)
          .map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground outline-none hover:bg-accent/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring',
                s.id === 'danger' && 'text-destructive hover:bg-destructive/10'
              )}
            >
              {s.label}
            </a>
          ))}
      </nav>

      <section id="general" className="flex scroll-mt-24 flex-col gap-3">
        <h2 className="text-lg font-semibold">{t('sections.general')}</h2>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">{t('nameLabel')}</dt>
            <dd className="mt-1 font-medium">{space.name}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t('slugLabel')}</dt>
            <dd className="mt-1 font-medium" dir="ltr">
              {space.slug}
            </dd>
          </div>
        </dl>
        <p className="text-sm text-muted-foreground">{t('generalSoon')}</p>
      </section>

      <section id="branding" className="flex scroll-mt-24 flex-col gap-3">
        <h2 className="text-lg font-semibold">{t('brandingTitle')}</h2>
        <p className="text-sm text-muted-foreground">{t('brandingDescription')}</p>
        <SpaceBranding space={space} variant="settings" />
      </section>

      {canBilling ? (
        <section id="billing" className="flex scroll-mt-24 flex-col gap-3">
          <h2 className="text-lg font-semibold">{t('sections.billing')}</h2>
          <p className="text-sm text-muted-foreground">{t('billingSoon')}</p>
        </section>
      ) : null}

      {canDelete ? (
        <section id="danger" className="flex scroll-mt-24 flex-col gap-3">
          <h2 className="text-lg font-semibold text-destructive">
            {t('sections.danger')}
          </h2>
          <p className="text-sm text-muted-foreground">{t('dangerSoon')}</p>
        </section>
      ) : null}
    </div>
  );
}
