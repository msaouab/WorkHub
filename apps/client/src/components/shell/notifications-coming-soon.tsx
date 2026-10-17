'use client';

import { BellIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ComingSoon } from '@/components/shell/coming-soon';
import { ROUTES } from '@/lib/routes';

/** Client wrapper so BellIcon isn't passed across the server/client boundary. */
export function NotificationsComingSoon() {
  const t = useTranslations('ComingSoon');

  return (
    <ComingSoon
      feature="notifications"
      icon={BellIcon}
      backHref={ROUTES.dashboard}
      backLabel={t('backToDashboard')}
    />
  );
}
