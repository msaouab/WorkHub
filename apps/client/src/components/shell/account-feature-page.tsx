'use client';

import { ComingSoon, type ComingSoonFeature } from '@/components/shell/coming-soon';
import { useTranslations } from 'next-intl';
import { ROUTES } from '@/lib/routes';

type AccountFeaturePageProps = {
  feature: ComingSoonFeature;
};

/** Coming-soon account-settings feature (WH-053). */
export function AccountFeaturePage({ feature }: AccountFeaturePageProps) {
  const t = useTranslations('ComingSoon');

  return (
    <ComingSoon
      feature={feature}
      backHref={ROUTES.settings}
      backLabel={t('backToProfile')}
    />
  );
}
