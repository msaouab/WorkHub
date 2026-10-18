'use client';

import type { SpaceInvite } from '@work-hub/contracts';
import { ChevronDownIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { LogoLoader } from '@/components/brand/logo-loader';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useInviteActions, useInvites } from '@/hooks/use-invites';
import { useRoleLabel } from '@/hooks/use-role-label';
import { useCurrentSpace } from '@/hooks/use-space';
import { ApiError } from '@/lib/api/fetch';
import { cn } from '@/lib/utils';

const ERROR_CODES = [
  'ALREADY_MEMBER',
  'CONFLICT',
  'INVITE_NOT_FOUND',
] as const;

type InviteErrorCode = (typeof ERROR_CODES)[number];

function isInviteErrorCode(value: string): value is InviteErrorCode {
  return (ERROR_CODES as readonly string[]).includes(value);
}

export function TeamInvitations() {
  const t = useTranslations('Team.invitations');
  const tInvites = useTranslations('Spaces.invites');
  const { space } = useCurrentSpace();
  const pendingQuery = useInvites(space?.id, 'pending');
  const pastQuery = useInvites(space?.id, 'past');
  const actions = useInviteActions(space?.id ?? '');
  const [pastOpen, setPastOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<SpaceInvite | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const pending = useMemo(
    () => pendingQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [pendingQuery.data]
  );
  const past = useMemo(
    () => pastQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [pastQuery.data]
  );

  if (!space) {
    return null;
  }

  async function confirmRevoke() {
    if (!revokeTarget) {
      return;
    }
    setActionError(null);
    try {
      await actions.revoke.mutateAsync(revokeTarget.id);
      setRevokeTarget(null);
    } catch (err) {
      setActionError(mapInviteError(err, tInvites));
    }
  }

  async function onResend(invite: SpaceInvite) {
    setActionError(null);
    try {
      await actions.resend.mutateAsync(invite.id);
    } catch (err) {
      setActionError(mapInviteError(err, tInvites));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {actionError ? (
        <p role="alert" className="text-sm text-destructive">
          {actionError}
        </p>
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-foreground">
          {t('pendingTitle')}
        </h2>
        {pendingQuery.isLoading ? (
          <div className="flex justify-center py-12">
            <LogoLoader size="lg" showLabel label={tInvites('loading')} />
          </div>
        ) : pendingQuery.isError ? (
          <p role="alert" className="text-sm text-destructive">
            {tInvites('failed')}
          </p>
        ) : pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('pendingEmpty')}</p>
        ) : (
          <InviteTable
            items={pending}
            mode="pending"
            onRevoke={setRevokeTarget}
            onResend={(invite) => void onResend(invite)}
            busy={actions.resend.isPending || actions.revoke.isPending}
          />
        )}
        {pendingQuery.hasNextPage ? (
          <Button
            type="button"
            variant="outline"
            className="self-start"
            disabled={pendingQuery.isFetchingNextPage}
            onClick={() => void pendingQuery.fetchNextPage()}
          >
            {pendingQuery.isFetchingNextPage
              ? tInvites('loadingMore')
              : tInvites('loadMore')}
          </Button>
        ) : null}
      </section>

      <section className="flex flex-col gap-3">
        <button
          type="button"
          className="flex items-center gap-2 text-start text-sm font-medium text-foreground"
          aria-expanded={pastOpen}
          onClick={() => setPastOpen((open) => !open)}
        >
          <ChevronDownIcon
            className={cn(
              'size-4 transition-transform',
              pastOpen ? 'rotate-0' : '-rotate-90'
            )}
            aria-hidden
          />
          {t('pastTitle')}
          {past.length > 0 ? (
            <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
              {past.length}
              {pastQuery.hasNextPage ? '+' : ''}
            </span>
          ) : null}
        </button>
        {pastOpen ? (
          pastQuery.isLoading ? (
            <div className="flex justify-center py-8">
              <LogoLoader size="md" showLabel label={tInvites('loading')} />
            </div>
          ) : past.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('pastEmpty')}</p>
          ) : (
            <>
              <InviteTable
                items={past}
                mode="past"
                onRevoke={setRevokeTarget}
                onResend={(invite) => void onResend(invite)}
                busy={actions.resend.isPending}
              />
              {pastQuery.hasNextPage ? (
                <Button
                  type="button"
                  variant="outline"
                  className="self-start"
                  disabled={pastQuery.isFetchingNextPage}
                  onClick={() => void pastQuery.fetchNextPage()}
                >
                  {pastQuery.isFetchingNextPage
                    ? tInvites('loadingMore')
                    : tInvites('loadMore')}
                </Button>
              ) : null}
            </>
          )
        ) : null}
      </section>

      <Dialog
        open={Boolean(revokeTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setRevokeTarget(null);
            setActionError(null);
          }
        }}
      >
        <DialogContent variant="modal">
          <DialogTitle>{tInvites('confirmRevokeTitle')}</DialogTitle>
          <DialogDescription className="mt-2">
            {tInvites('confirmRevokeDescription')}
          </DialogDescription>
          <div className="mt-5 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRevokeTarget(null)}
            >
              {tInvites('cancel')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={actions.revoke.isPending}
              onClick={() => void confirmRevoke()}
            >
              {actions.revoke.isPending
                ? tInvites('working')
                : tInvites('revoke')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InviteTable({
  items,
  mode,
  onRevoke,
  onResend,
  busy,
}: {
  items: SpaceInvite[];
  mode: 'pending' | 'past';
  onRevoke: (invite: SpaceInvite) => void;
  onResend: (invite: SpaceInvite) => void;
  busy: boolean;
}) {
  const t = useTranslations('Team.invitations');
  const tInvites = useTranslations('Spaces.invites');

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{tInvites('columns.type')}</TableHead>
          <TableHead>{tInvites('columns.target')}</TableHead>
          <TableHead>{tInvites('columns.role')}</TableHead>
          <TableHead className="hidden md:table-cell">{t('invitedBy')}</TableHead>
          <TableHead>{tInvites('columns.expires')}</TableHead>
          <TableHead className="w-[1%]">{tInvites('columns.actions')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((invite) => (
          <InviteRow
            key={invite.id}
            invite={invite}
            mode={mode}
            onRevoke={() => onRevoke(invite)}
            onResend={() => onResend(invite)}
            busy={busy}
          />
        ))}
      </TableBody>
    </Table>
  );
}

function InviteRow({
  invite,
  mode,
  onRevoke,
  onResend,
  busy,
}: {
  invite: SpaceInvite;
  mode: 'pending' | 'past';
  onRevoke: () => void;
  onResend: () => void;
  busy: boolean;
}) {
  const t = useTranslations('Team.invitations');
  const tInvites = useTranslations('Spaces.invites');
  const roleLabel = useRoleLabel(invite.role.name);
  const canResendEmail = invite.kind === 'email';

  return (
    <TableRow>
      <TableCell>
        {invite.kind === 'email' ? tInvites('kindEmail') : tInvites('kindLink')}
      </TableCell>
      <TableCell className="max-w-56 truncate" dir="ltr">
        {invite.email ?? tInvites('anyoneWithLink')}
      </TableCell>
      <TableCell>{roleLabel}</TableCell>
      <TableCell className="hidden max-w-40 truncate md:table-cell">
        {invite.createdBy.name}
      </TableCell>
      <TableCell>
        <time dateTime={invite.expiresAt}>
          {new Date(invite.expiresAt).toLocaleDateString()}
        </time>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap justify-end gap-1">
          {canResendEmail ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={onResend}
            >
              {t('resend')}
            </Button>
          ) : null}
          {mode === 'pending' ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={onRevoke}
            >
              {tInvites('revoke')}
            </Button>
          ) : null}
        </div>
      </TableCell>
    </TableRow>
  );
}

function mapInviteError(
  err: unknown,
  t: ReturnType<typeof useTranslations<'Spaces.invites'>>
): string {
  if (err instanceof ApiError && err.problem?.code) {
    const code = err.problem.code;
    if (isInviteErrorCode(code)) {
      return t(`errors.${code}`);
    }
  }
  return t('actionFailed');
}
