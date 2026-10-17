'use client';

import type { Permission } from '@work-hub/constants';
import { ComingSoon, type ComingSoonFeature } from '@/components/shell/coming-soon';
import { RequireSpacePermission } from '@/components/shell/require-space-permission';
import { useCurrentSpace } from '@/hooks/use-space';
import { useTranslations } from 'next-intl';
import { SPACE_NAV_ICONS } from '@/lib/nav/space-nav-icons';
import type { SpaceNavIcon } from '@/lib/nav/space-nav';
import { ROUTES } from '@/lib/routes';

type SpaceFeaturePageProps = {
  feature: ComingSoonFeature;
  icon: SpaceNavIcon;
  permission?: Permission | readonly Permission[];
};

/** Coming-soon workspace feature with permission gate (WH-053). */
export function SpaceFeaturePage({
  feature,
  icon,
  permission,
}: SpaceFeaturePageProps) {
  const t = useTranslations('ComingSoon');
  const { slug } = useCurrentSpace();
  const backHref = slug ? `${ROUTES.space}/${slug}` : ROUTES.dashboard;

  return (
    <RequireSpacePermission permission={permission}>
      <ComingSoon
        feature={feature}
        icon={SPACE_NAV_ICONS[icon]}
        backHref={backHref}
        backLabel={t('backToHome')}
      />
    </RequireSpacePermission>
  );
}
