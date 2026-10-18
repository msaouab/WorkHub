'use client';

import { PERMISSIONS } from '@work-hub/constants';
import { NetworkIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  useCallback,
  useEffect,
  useId,
  useState,
  type KeyboardEvent,
} from 'react';
import { ComingSoon } from '@/components/shell/coming-soon';
import { PageHeader } from '@/components/shell/page-header';
import { InvitePeopleDialog } from '@/components/team/invite-people-dialog';
import { TeamInvitations } from '@/components/team/team-invitations';
import { TeamMembers } from '@/components/team/team-members';
import { Button } from '@/components/ui/button';
import { useCan } from '@/hooks/use-can';
import { useDirection } from '@/hooks/use-direction';
import { useInvites } from '@/hooks/use-invites';
import { useMembers } from '@/hooks/use-members';
import { useCurrentSpace } from '@/hooks/use-space';
import { useRouter } from '@/i18n/navigation';
import { ROUTES } from '@/lib/routes';
import { cn } from '@/lib/utils';

export type TeamTab = 'members' | 'invitations' | 'groups';

const TABS: readonly TeamTab[] = ['members', 'invitations', 'groups'] as const;

function parseTab(value: string | null | undefined): TeamTab {
  if (value === 'invitations' || value === 'groups' || value === 'members') {
    return value;
  }
  return 'members';
}

type TeamPageProps = {
  initialTab?: string;
};

export function TeamPage({ initialTab }: TeamPageProps) {
  const t = useTranslations('Team');
  const tSoon = useTranslations('ComingSoon');
  const { space } = useCurrentSpace();
  const canInvite = useCan(PERMISSIONS.INVITES_WRITE);
  const direction = useDirection();
  const router = useRouter();
  const baseId = useId();
  const [tab, setTab] = useState<TeamTab>(() => parseTab(initialTab));
  const [inviteOpen, setInviteOpen] = useState(false);

  const membersQuery = useMembers(space?.id, {});
  const pendingInvites = useInvites(
    canInvite ? space?.id : undefined,
    'pending'
  );

  const memberCount =
    membersQuery.data?.pages.reduce((n, p) => n + p.items.length, 0) ?? 0;
  const inviteCount =
    pendingInvites.data?.pages.reduce((n, p) => n + p.items.length, 0) ?? 0;

  useEffect(() => {
    setTab(parseTab(initialTab));
  }, [initialTab]);

  const selectTab = useCallback(
    (next: TeamTab) => {
      setTab(next);
      const href =
        next === 'members'
          ? `${ROUTES.space}/${space?.slug}/team`
          : `${ROUTES.space}/${space?.slug}/team?tab=${next}`;
      router.replace(href);
    },
    [router, space?.slug]
  );

  const onTabKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const visible = TABS.filter(
      (id) => id !== 'invitations' || canInvite
    );
    const index = visible.indexOf(tab);
    if (index < 0) {
      return;
    }
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      // In RTL, ArrowLeft advances (visual "next"); ArrowRight goes back.
      const forward = direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
      const delta = event.key === forward ? 1 : -1;
      const next = visible[(index + delta + visible.length) % visible.length];
      if (next) {
        selectTab(next);
      }
    } else if (event.key === 'Home') {
      event.preventDefault();
      const first = visible[0];
      if (first) {
        selectTab(first);
      }
    } else if (event.key === 'End') {
      event.preventDefault();
      const last = visible[visible.length - 1];
      if (last) {
        selectTab(last);
      }
    }
  };

  if (!space) {
    return null;
  }

  // Members without invites.write shouldn't land on invitations.
  const activeTab =
    tab === 'invitations' && !canInvite ? 'members' : tab;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t('title')}
        description={t('description', { name: space.name })}
        actions={
          canInvite ? (
            <Button type="button" onClick={() => setInviteOpen(true)}>
              {t('invitePeople')}
            </Button>
          ) : null
        }
      />

      <div
        role="tablist"
        aria-label={t('tabsLabel')}
        className="flex flex-wrap gap-1 border-b border-border"
        onKeyDown={onTabKeyDown}
      >
        {(
          [
            {
              id: 'members' as const,
              label: t('tabs.members'),
              count: memberCount,
              showPlus: membersQuery.hasNextPage,
            },
            ...(canInvite
              ? [
                  {
                    id: 'invitations' as const,
                    label: t('tabs.invitations'),
                    count: inviteCount,
                    showPlus: pendingInvites.hasNextPage,
                  },
                ]
              : []),
            {
              id: 'groups' as const,
              label: t('tabs.groups'),
              count: null as number | null,
              showPlus: false,
            },
          ] as const
        ).map((item) => {
          const selected = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`${baseId}-tab-${item.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${item.id}`}
              tabIndex={selected ? 0 : -1}
              className={cn(
                '-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors',
                selected
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
              onClick={() => selectTab(item.id)}
            >
              {item.label}
              {item.count !== null ? (
                <span className="ms-1.5 rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                  {item.count}
                  {item.showPlus ? '+' : ''}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`${baseId}-panel-${activeTab}`}
        aria-labelledby={`${baseId}-tab-${activeTab}`}
      >
        {activeTab === 'members' ? <TeamMembers /> : null}
        {activeTab === 'invitations' && canInvite ? <TeamInvitations /> : null}
        {activeTab === 'groups' ? (
          <ComingSoon
            feature="teams"
            icon={NetworkIcon}
            backHref={`${ROUTES.space}/${space.slug}`}
            backLabel={tSoon('backToHome')}
          />
        ) : null}
      </div>

      {canInvite ? (
        <InvitePeopleDialog
          spaceId={space.id}
          open={inviteOpen}
          onOpenChange={setInviteOpen}
        />
      ) : null}
    </div>
  );
}
