'use client';

import { PERMISSIONS } from '@work-hub/constants';
import type { SpaceMember, SpaceTeam } from '@work-hub/contracts';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { UserAvatar } from '@/components/account/user-avatar';
import { LogoLoader } from '@/components/brand/logo-loader';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCan } from '@/hooks/use-can';
import { useMembers } from '@/hooks/use-members';
import { useCurrentSpace } from '@/hooks/use-space';
import { useSpaceTeams, useTeamActions } from '@/hooks/use-teams';
import { ApiError } from '@/lib/api/fetch';
import { cn } from '@/lib/utils';

const TEAM_ERROR_CODES = [
  'TEAM_NAME_TAKEN',
  'MEMBERSHIP_NOT_IN_SPACE',
  'VALIDATION_FAILED',
  'CONFLICT',
] as const;

type TeamErrorCode = (typeof TEAM_ERROR_CODES)[number];

function isTeamErrorCode(value: string): value is TeamErrorCode {
  return (TEAM_ERROR_CODES as readonly string[]).includes(value);
}

/** Groups tab — workspace teams (WH-058). */
export function TeamGroups() {
  const t = useTranslations('Team.groups');
  const { space } = useCurrentSpace();
  const canWrite = useCan(PERMISSIONS.TEAMS_WRITE);
  const teamsQuery = useSpaceTeams(space?.id);
  const actions = useTeamActions(space?.id ?? '');
  const [editor, setEditor] = useState<
    { mode: 'create' } | { mode: 'edit'; team: SpaceTeam } | null
  >(null);
  const [deleteTarget, setDeleteTarget] = useState<SpaceTeam | null>(null);
  const [error, setError] = useState<string | null>(null);

  const teams = teamsQuery.data?.items ?? [];

  function mapError(err: unknown): string {
    if (err instanceof ApiError && err.problem?.code) {
      const code = err.problem.code;
      if (isTeamErrorCode(code)) {
        return t(`errors.${code}`);
      }
    }
    return t('errors.failed');
  }

  if (!space) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{t('description')}</p>
        {canWrite ? (
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setError(null);
              setEditor({ mode: 'create' });
            }}
          >
            {t('newGroup')}
          </Button>
        ) : null}
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {teamsQuery.isPending ? (
        <div className="flex justify-center py-12">
          <LogoLoader size="lg" showLabel label={t('loading')} />
        </div>
      ) : null}

      {teamsQuery.isError ? (
        <p className="text-sm text-destructive">{t('failed')}</p>
      ) : null}

      {!teamsQuery.isPending && !teamsQuery.isError && teams.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
          {canWrite ? t('emptyWritable') : t('empty')}
        </p>
      ) : null}

      {teams.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {teams.map((team) => (
            <li
              key={team.id}
              className="rounded-xl border border-border/80 bg-background/90 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-medium text-foreground">{team.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t('counts', {
                      members: team.members.length,
                      managers: team.managers.length,
                    })}
                  </p>
                </div>
                {canWrite ? (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setError(null);
                        setEditor({ mode: 'edit', team });
                      }}
                    >
                      {t('edit')}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setError(null);
                        setDeleteTarget(team);
                      }}
                    >
                      {t('delete')}
                    </Button>
                  </div>
                ) : null}
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <PersonList
                  title={t('managers')}
                  people={team.managers}
                  empty={t('noManagers')}
                />
                <PersonList
                  title={t('members')}
                  people={team.members}
                  empty={t('noMembers')}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {editor ? (
        <GroupEditorDialog
          spaceId={space.id}
          mode={editor.mode}
          initial={editor.mode === 'edit' ? editor.team : null}
          busy={actions.create.isPending || actions.update.isPending}
          onClose={() => setEditor(null)}
          onSave={async (payload) => {
            try {
              if (editor.mode === 'create') {
                await actions.create.mutateAsync(payload);
              } else {
                await actions.update.mutateAsync({
                  teamId: editor.team.id,
                  body: payload,
                });
              }
              setEditor(null);
              setError(null);
            } catch (err) {
              setError(mapError(err));
              throw err;
            }
          }}
        />
      ) : null}

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
      >
        <DialogContent variant="modal">
          <DialogTitle>{t('confirmDeleteTitle')}</DialogTitle>
          <DialogDescription className="mt-2">
            {t('confirmDeleteDescription', {
              name: deleteTarget?.name ?? '',
            })}
          </DialogDescription>
          <div className="mt-5 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={actions.remove.isPending}
              onClick={() => setDeleteTarget(null)}
            >
              {t('cancel')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={actions.remove.isPending || !deleteTarget}
              onClick={() => {
                if (!deleteTarget) {
                  return;
                }
                void actions.remove
                  .mutateAsync(deleteTarget.id)
                  .then(() => {
                    setDeleteTarget(null);
                    setError(null);
                  })
                  .catch((err: unknown) => {
                    setError(mapError(err));
                    setDeleteTarget(null);
                  });
              }}
            >
              {t('delete')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PersonList({
  title,
  people,
  empty,
}: {
  title: string;
  people: SpaceTeam['members'];
  empty: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      {people.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-1.5">
          {people.map((person) => (
            <li
              key={person.membershipId}
              className="flex items-center gap-2 text-sm"
            >
              <UserAvatar
                name={person.name}
                userId={person.userId}
                image={person.image}
                className="size-6"
              />
              <span className="truncate">{person.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function GroupEditorDialog({
  spaceId,
  mode,
  initial,
  busy,
  onClose,
  onSave,
}: {
  spaceId: string;
  mode: 'create' | 'edit';
  initial: SpaceTeam | null;
  busy: boolean;
  onClose: () => void;
  onSave: (payload: {
    name: string;
    memberIds: string[];
    managerIds: string[];
  }) => Promise<void>;
}) {
  const t = useTranslations('Team.groups');
  const membersQuery = useMembers(spaceId, { status: 'active' });
  const [name, setName] = useState(initial?.name ?? '');
  const [memberIds, setMemberIds] = useState(
    () => new Set<string>(initial?.members.map((m) => m.membershipId) ?? [])
  );
  const [managerIds, setManagerIds] = useState(
    () => new Set<string>(initial?.managers.map((m) => m.membershipId) ?? [])
  );
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (membersQuery.hasNextPage && !membersQuery.isFetchingNextPage) {
      void membersQuery.fetchNextPage();
    }
  }, [membersQuery]);

  const people = useMemo(() => {
    const items =
      membersQuery.data?.pages.flatMap((page) => page.items) ?? [];
    const byId = new Map<string, SpaceMember>();
    for (const item of items) {
      byId.set(item.id, item);
    }
    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [membersQuery.data]);

  const approvers = useMemo(
    () =>
      people.filter((person) =>
        person.role.permissions.includes(PERMISSIONS.LEAVE_APPROVE)
      ),
    [people]
  );

  useEffect(() => {
    if (membersQuery.isPending) {
      return;
    }
    const allowed = new Set(approvers.map((person) => person.id));
    setManagerIds((prev) => {
      const next = new Set(
        [...prev].filter((id) => allowed.has(id))
      );
      if (next.size === prev.size) {
        return prev;
      }
      return next;
    });
  }, [approvers, membersQuery.isPending]);

  function toggle(set: Set<string>, id: string): Set<string> {
    const next = new Set(set);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    return next;
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent variant="modal" className="max-w-lg">
        <DialogTitle>
          {mode === 'create' ? t('createTitle') : t('editTitle')}
        </DialogTitle>
        <DialogDescription className="mt-1">
          {t('editorDescription')}
        </DialogDescription>

        <form
          className="mt-4 flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            const trimmed = name.trim();
            if (!trimmed) {
              setLocalError(t('nameRequired'));
              return;
            }
            setLocalError(null);
            void onSave({
              name: trimmed,
              memberIds: [...memberIds],
              managerIds: [...managerIds],
            }).catch(() => {
              /* parent surfaces API error */
            });
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="group-name">{t('name')}</Label>
            <Input
              id="group-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={100}
              required
              autoFocus
            />
          </div>

          <MemberChecklist
            title={t('managers')}
            hint={t('managersHint')}
            empty={t('managersEmpty')}
            people={approvers}
            selected={managerIds}
            onToggle={(id) => setManagerIds((prev) => toggle(prev, id))}
            loading={membersQuery.isPending}
          />

          <MemberChecklist
            title={t('members')}
            hint={t('membersHint')}
            people={people}
            selected={memberIds}
            onToggle={(id) => setMemberIds((prev) => toggle(prev, id))}
            loading={membersQuery.isPending}
          />

          {localError ? (
            <p className="text-sm text-destructive" role="alert">
              {localError}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={onClose}
            >
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={busy || membersQuery.isPending}>
              {mode === 'create' ? t('create') : t('save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function MemberChecklist({
  title,
  hint,
  empty,
  people,
  selected,
  onToggle,
  loading,
}: {
  title: string;
  hint: string;
  empty?: string;
  people: SpaceMember[];
  selected: Set<string>;
  onToggle: (membershipId: string) => void;
  loading: boolean;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium text-foreground">{title}</legend>
      <p className="text-xs text-muted-foreground">{hint}</p>
      {loading ? (
        <p className="text-sm text-muted-foreground">…</p>
      ) : people.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {empty ?? hint}
        </p>
      ) : (
        <ul className="max-h-40 overflow-y-auto rounded-lg border border-border">
          {people.map((person) => {
            const checked = selected.has(person.id);
            return (
              <li key={person.id}>
                <label
                  className={cn(
                    'flex cursor-pointer items-center gap-2 px-3 py-2 text-sm',
                    'hover:bg-muted/60',
                    checked && 'bg-muted/40'
                  )}
                >
                  <input
                    type="checkbox"
                    className="size-4 accent-foreground"
                    checked={checked}
                    onChange={() => onToggle(person.id)}
                  />
                  <UserAvatar
                    name={person.name}
                    userId={person.userId}
                    image={person.image}
                    className="size-6"
                  />
                  <span className="min-w-0 flex-1 truncate">{person.name}</span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </fieldset>
  );
}
