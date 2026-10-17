'use client';

import type { LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/shell/page-header';
import { buttonVariants } from '@/components/ui/button-variants';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

export type ComingSoonFeature =
  | 'leave'
  | 'calendar'
  | 'holidays'
  | 'documents'
  | 'people'
  | 'approvals'
  | 'invites'
  | 'roles'
  | 'teams'
  | 'leavePolicies'
  | 'signInMethods'
  | 'sessions'
  | 'notifications'
  | 'deleteAccount'
  | 'search'
  | 'dashboardRequests';

type ComingSoonProps = {
  feature: ComingSoonFeature;
  icon?: LucideIcon;
  backHref: string;
  backLabel: string;
};

/** Shared placeholder for features not built yet (WH-053). */
export function ComingSoon({
  feature,
  icon: Icon,
  backHref,
  backLabel,
}: ComingSoonProps) {
  const t = useTranslations('ComingSoon');
  const name = t(`features.${feature}` as 'features.leave');

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={name} />
      <div className="flex flex-col items-start gap-4">
        {Icon ? (
          <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Icon className="size-6" aria-hidden />
          </span>
        ) : null}
        <p className="max-w-md text-muted-foreground">{t('description')}</p>
        <Link
          href={backHref}
          className={cn(buttonVariants({ variant: 'outline' }))}
        >
          {backLabel}
        </Link>
      </div>
    </div>
  );
}
