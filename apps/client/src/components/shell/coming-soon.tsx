'use client';

import type { LucideIcon } from 'lucide-react';
import { ArrowLeftIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
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
  | 'roles'
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
  const tShell = useTranslations('Shell');
  const name = t(`features.${feature}` as 'features.leave');

  return (
    <div className="flex min-h-[min(28rem,calc(100svh-12rem))] flex-col items-center justify-center py-6 text-center">
      <div className="flex w-full max-w-md flex-col items-center gap-6">
        {Icon ? (
          <div
            className="flex size-20 items-center justify-center rounded-3xl border border-dashed border-border/80 bg-muted/40"
            aria-hidden
          >
            <span className="flex size-14 items-center justify-center rounded-2xl bg-background text-foreground shadow-sm ring-1 ring-border/70">
              <Icon className="size-7" />
            </span>
          </div>
        ) : null}

        <div className="flex flex-col items-center gap-3">
          <span className="rounded-md bg-muted px-1.5 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
            {tShell('soon')}
          </span>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-balance">
            {name}
          </h1>
          <p className="max-w-sm text-pretty text-muted-foreground">
            {t('description')}
          </p>
        </div>

        <Link
          href={backHref}
          className={cn(buttonVariants({ variant: 'outline' }))}
        >
          <ArrowLeftIcon
            data-icon="inline-start"
            className="rtl:rotate-180"
            aria-hidden
          />
          {backLabel}
        </Link>
      </div>
    </div>
  );
}
