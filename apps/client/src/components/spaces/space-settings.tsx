'use client';

import { PERMISSIONS } from '@work-hub/constants';
import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/shell/page-header';
import { RequireSpacePermission } from '@/components/shell/require-space-permission';
import { SpaceBranding } from '@/components/spaces/space-branding';
import { useCan } from '@/hooks/use-can';
import { useCurrentSpace } from '@/hooks/use-space';
import { cn } from '@/lib/utils';

type SectionId = 'general' | 'branding' | 'billing' | 'danger';

type Section = {
  id: SectionId;
  label: string;
  show: boolean;
  soon?: boolean;
  danger?: boolean;
};

/** Workspace settings with in-page section nav (WH-053). Owner-only. */
export function SpaceSettings() {
  return (
    <RequireSpacePermission permission={PERMISSIONS.SPACE_SETTINGS_WRITE}>
      <SpaceSettingsBody />
    </RequireSpacePermission>
  );
}

function SpaceSettingsBody() {
  const t = useTranslations('Spaces.settings');
  const tShell = useTranslations('Shell');
  const { space } = useCurrentSpace();
  const canBilling = useCan(PERMISSIONS.SPACE_BILLING_WRITE);
  const canDelete = useCan(PERMISSIONS.SPACE_DELETE);

  const sections = useMemo<Section[]>(
    () => [
      { id: 'general', label: t('sections.general'), show: true },
      { id: 'branding', label: t('sections.branding'), show: true },
      {
        id: 'billing',
        label: t('sections.billing'),
        show: canBilling,
        soon: true,
      },
      {
        id: 'danger',
        label: t('sections.danger'),
        show: canDelete,
        soon: true,
        danger: true,
      },
    ],
    [t, canBilling, canDelete]
  );

  const visible = useMemo(
    () => sections.filter((s) => s.show),
    [sections]
  );
  const sectionIds = useMemo(() => visible.map((s) => s.id), [visible]);
  const activeId = useActiveSection(sectionIds);

  if (!space) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t('title')} description={t('description')} />

      <nav
        aria-label={t('sectionNav')}
        className="sticky top-0 z-10 flex flex-wrap gap-1 overflow-x-auto border-b border-border bg-background"
      >
        {visible.map((s) => {
          const active = activeId === s.id;
          return (
            <a
              key={s.id}
              href={`#${s.id}`}
              aria-current={active ? 'true' : undefined}
              className={cn(
                '-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors outline-none',
                'focus-visible:ring-2 focus-visible:ring-ring',
                active
                  ? s.danger
                    ? 'border-destructive text-destructive'
                    : 'border-foreground text-foreground'
                  : s.danger
                    ? 'border-transparent text-destructive/80 hover:text-destructive'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <span>{s.label}</span>
              {s.soon ? (
                <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                  {tShell('soon')}
                </span>
              ) : null}
            </a>
          );
        })}
      </nav>

      <section id="general" className="flex scroll-mt-28 flex-col gap-3">
        <h2 className="text-sm font-medium text-foreground">
          {t('sections.general')}
        </h2>
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

      <section id="branding" className="flex scroll-mt-28 flex-col gap-3">
        <h2 className="text-sm font-medium text-foreground">
          {t('brandingTitle')}
        </h2>
        <p className="text-sm text-muted-foreground">{t('brandingDescription')}</p>
        <SpaceBranding space={space} variant="settings" />
      </section>

      {canBilling ? (
        <section id="billing" className="flex scroll-mt-28 flex-col gap-3">
          <h2 className="text-sm font-medium text-foreground">
            {t('sections.billing')}
          </h2>
          <p className="text-sm text-muted-foreground">{t('billingSoon')}</p>
        </section>
      ) : null}

      {canDelete ? (
        <section id="danger" className="flex scroll-mt-28 flex-col gap-3">
          <h2 className="text-sm font-medium text-destructive">
            {t('sections.danger')}
          </h2>
          <p className="text-sm text-muted-foreground">{t('dangerSoon')}</p>
        </section>
      ) : null}
    </div>
  );
}

/** Highlights the section in view (or from the URL hash). */
function useActiveSection(ids: SectionId[]): SectionId | null {
  const [active, setActive] = useState<SectionId | null>(ids[0] ?? null);

  useEffect(() => {
    if (ids.length === 0) {
      setActive(null);
      return;
    }

    function fromHash(): SectionId | null {
      const hash = window.location.hash.replace(/^#/, '') as SectionId;
      return ids.includes(hash) ? hash : null;
    }

    const hashed = fromHash();
    setActive(hashed ?? ids[0] ?? null);

    function onHashChange() {
      const next = fromHash();
      if (next) {
        setActive(next);
      }
    }
    window.addEventListener('hashchange', onHashChange);

    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) {
      return () => window.removeEventListener('hashchange', onHashChange);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (hit?.target.id && ids.includes(hit.target.id as SectionId)) {
          setActive(hit.target.id as SectionId);
        }
      },
      { rootMargin: '-25% 0px -55% 0px', threshold: [0, 0.25, 0.5, 1] }
    );

    for (const el of elements) {
      observer.observe(el);
    }

    return () => {
      observer.disconnect();
      window.removeEventListener('hashchange', onHashChange);
    };
  }, [ids]);

  return active;
}
