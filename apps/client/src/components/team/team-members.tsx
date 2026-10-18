'use client';

import {
  PERMISSIONS,
  SYSTEM_ROLE_NAMES,
  permissionsAreSubset,
} from '@work-hub/constants';
import type { SpaceMember, SpaceRoleOption } from '@work-hub/contracts';
import { ChevronDownIcon, MoreHorizontalIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useId, useMemo, useState } from 'react';
import { UserAvatar } from '@/components/account/user-avatar';
import { LogoLoader } from '@/components/brand/logo-loader';
import { RoleSelect } from '@/components/team/role-select';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button-variants';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCan } from '@/hooks/use-can';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useMe } from '@/hooks/use-me';
import { useMemberActions } from '@/hooks/use-member-actions';
import { useMembers } from '@/hooks/use-members';
import { useRoleLabel } from '@/hooks/use-role-label';
import { useSpaceRoles } from '@/hooks/use-roles';
import { useCurrentSpace } from '@/hooks/use-space';
import { ApiError } from '@/lib/api/fetch';
import { cn } from '@/lib/utils';

const fieldTriggerClassName = cn(
  buttonVariants({ variant: 'outline' }),
  'min-w-40 justify-between gap-2 px-2.5 font-normal'
);

type PendingAction =
  | { type: 'deactivate' | 'reactivate' | 'remove'; member: SpaceMember }
  | { type: 'leave' }
  | null;

const ERROR_CODES = [
  'CANNOT_MODIFY_OWNER',
  'CANNOT_DEACTIVATE_SELF',
  'CANNOT_REMOVE_SELF',
  'LAST_OWNER',
  'CANNOT_CHANGE_OWN_ROLE',
  'CANNOT_ASSIGN_OWNER',
  'ROLE_ESCALATION',
] as const;

type MemberErrorCode = (typeof ERROR_CODES)[number];

function isMemberErrorCode(value: string): value is MemberErrorCode {
  return (ERROR_CODES as readonly string[]).includes(value);
}

export function TeamMembers() {
  const t = useTranslations('Spaces.members');
  const tTeam = useTranslations('Team');
  const tHome = useTranslations('Spaces.home');
  const { space } = useCurrentSpace();
  const { data: me } = useMe();
  const canWrite = useCan(PERMISSIONS.MEMBERS_WRITE);
  const canChangeRoles = useCan(PERMISSIONS.ROLES_WRITE);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'' | 'active' | 'deactivated'>('');
  const [role, setRole] = useState('');
  const debouncedQ = useDebouncedValue(search.trim(), 300);
  const membersQuery = useMembers(space?.id, {
    q: debouncedQ,
    status: status || undefined,
    role: role || undefined,
  });
  const rolesQuery = useSpaceRoles(
    canChangeRoles ? space?.id : undefined
  );
  const actions = useMemberActions(space?.id ?? '');
  const [pending, setPending] = useState<PendingAction>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const items = useMemo(
    () => membersQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [membersQuery.data]
  );

  const assignableRoles = useMemo(() => {
    const actorPermissions = space?.permissions ?? [];
    return (rolesQuery.data?.items ?? []).filter(
      (row) =>
        row.name !== SYSTEM_ROLE_NAMES.OWNER &&
        permissionsAreSubset(row.permissions, actorPermissions)
    );
  }, [rolesQuery.data?.items, space?.permissions]);

  /** When the full unfiltered list is loaded, hide Leave for the sole Owner. */
  const hideLeaveAsLastOwner = useMemo(() => {
    if (
      debouncedQ ||
      status ||
      role ||
      membersQuery.hasNextPage ||
      !me?.id
    ) {
      return false;
    }
    const owners = items.filter(
      (m) => m.role.name === SYSTEM_ROLE_NAMES.OWNER
    );
    return owners.length === 1 && owners[0]?.userId === me.id;
  }, [debouncedQ, status, role, membersQuery.hasNextPage, items, me?.id]);

  if (!space) {
    return null;
  }

  const busy =
    actions.deactivate.isPending ||
    actions.reactivate.isPending ||
    actions.remove.isPending ||
    actions.updateRole.isPending ||
    actions.leave.isPending;

  async function onChangeRole(member: SpaceMember, roleId: string) {
    if (roleId === member.role.id) {
      return;
    }
    setActionError(null);
    try {
      await actions.updateRole.mutateAsync({
        membershipId: member.id,
        roleId,
      });
    } catch (err) {
      setActionError(mapActionError(err, t));
    }
  }

  async function confirmPending() {
    if (!pending || !space) {
      return;
    }
    setActionError(null);
    try {
      if (pending.type === 'leave') {
        await actions.leave.mutateAsync();
      } else if (pending.type === 'deactivate') {
        await actions.deactivate.mutateAsync(pending.member.id);
      } else if (pending.type === 'reactivate') {
        await actions.reactivate.mutateAsync(pending.member.id);
      } else {
        await actions.remove.mutateAsync(pending.member.id);
      }
      setPending(null);
    } catch (err) {
      setActionError(mapActionError(err, t));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:max-w-sm">
          <Label htmlFor="team-member-search" className="sr-only">
            {t('searchPlaceholder')}
          </Label>
          <Input
            id="team-member-search"
            type="search"
            value={search}
            onValueChange={setSearch}
            placeholder={t('searchPlaceholder')}
            aria-label={t('searchPlaceholder')}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label id="team-member-status-label">{tTeam('filters.status')}</Label>
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-labelledby="team-member-status-label"
              className={fieldTriggerClassName}
            >
              <span>
                {status === 'active'
                  ? tHome('statusValues.active')
                  : status === 'deactivated'
                    ? tHome('statusValues.deactivated')
                    : tTeam('filters.allStatuses')}
              </span>
              <ChevronDownIcon
                className="size-3.5 shrink-0 opacity-70"
                aria-hidden
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-40">
              <DropdownMenuRadioGroup
                value={status || 'all'}
                onValueChange={(value) =>
                  setStatus(
                    value === 'all'
                      ? ''
                      : (value as 'active' | 'deactivated')
                  )
                }
              >
                <DropdownMenuRadioItem value="all">
                  {tTeam('filters.allStatuses')}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="active">
                  {tHome('statusValues.active')}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="deactivated">
                  {tHome('statusValues.deactivated')}
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex flex-col gap-2">
          <Label id="team-member-role-label">{tTeam('filters.role')}</Label>
          <RoleFilterSelect
            labelledBy="team-member-role-label"
            value={role}
            onValueChange={setRole}
            allLabel={tTeam('filters.allRoles')}
          />
        </div>
      </div>

      {membersQuery.isPending ? (
        <div className="flex justify-center py-12">
          <LogoLoader size="lg" showLabel label={t('loading')} />
        </div>
      ) : null}

      {membersQuery.isError ? (
        <p className="text-sm text-destructive" role="alert">
          {t('failed')}
        </p>
      ) : null}

      {!membersQuery.isPending && !membersQuery.isError && items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('empty')}</p>
      ) : null}

      {items.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>{t('columns.member')}</TableHead>
              <TableHead className="hidden sm:table-cell">
                {t('columns.email')}
              </TableHead>
              <TableHead>{t('columns.role')}</TableHead>
              <TableHead className="hidden md:table-cell">
                {t('columns.status')}
              </TableHead>
              <TableHead className="hidden lg:table-cell">
                {t('columns.joined')}
              </TableHead>
              <TableHead className="w-12 text-end">
                <span className="sr-only">{t('columns.actions')}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                isSelf={member.userId === me?.id}
                canWrite={canWrite}
                canChangeRoles={canChangeRoles}
                assignableRoles={assignableRoles}
                roleChangeBusy={actions.updateRole.isPending}
                onChangeRole={onChangeRole}
                canLeave={
                  member.userId === me?.id ? !hideLeaveAsLastOwner : false
                }
                statusLabel={tHome(
                  `statusValues.${member.membershipStatus}` as 'statusValues.active'
                )}
                onAction={setPending}
                actionsLabel={t('actions')}
                youLabel={t('you')}
                deactivateLabel={t('deactivate')}
                reactivateLabel={t('reactivate')}
                removeLabel={t('remove')}
                leaveLabel={t('leave')}
                rolePlaceholder={t('columns.role')}
              />
            ))}
          </TableBody>
        </Table>
      ) : null}

      {actionError && !pending ? (
        <p className="text-sm text-destructive" role="alert">
          {actionError}
        </p>
      ) : null}

      {membersQuery.hasNextPage ? (
        <Button
          type="button"
          variant="outline"
          className="self-start"
          disabled={membersQuery.isFetchingNextPage}
          onClick={() => void membersQuery.fetchNextPage()}
        >
          {membersQuery.isFetchingNextPage ? t('loadingMore') : t('loadMore')}
        </Button>
      ) : null}

      <ConfirmDialog
        pending={pending}
        open={pending !== null}
        busy={busy}
        error={actionError}
        onOpenChange={(open) => {
          if (!open && !busy) {
            setPending(null);
            setActionError(null);
          }
        }}
        onConfirm={() => void confirmPending()}
        t={t}
      />
    </div>
  );
}

function RoleFilterSelect({
  labelledBy,
  value,
  onValueChange,
  allLabel,
}: {
  labelledBy: string;
  value: string;
  onValueChange: (value: string) => void;
  allLabel: string;
}) {
  const ownerLabel = useRoleLabel(SYSTEM_ROLE_NAMES.OWNER);
  const adminLabel = useRoleLabel(SYSTEM_ROLE_NAMES.ADMIN);
  const memberLabel = useRoleLabel(SYSTEM_ROLE_NAMES.MEMBER);
  const selectedLabel =
    value === SYSTEM_ROLE_NAMES.OWNER
      ? ownerLabel
      : value === SYSTEM_ROLE_NAMES.ADMIN
        ? adminLabel
        : value === SYSTEM_ROLE_NAMES.MEMBER
          ? memberLabel
          : allLabel;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-labelledby={labelledBy}
        className={fieldTriggerClassName}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDownIcon className="size-3.5 shrink-0 opacity-70" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-40">
        <DropdownMenuRadioGroup
          value={value || 'all'}
          onValueChange={(next) =>
            onValueChange(next === 'all' ? '' : next)
          }
        >
          <DropdownMenuRadioItem value="all">{allLabel}</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value={SYSTEM_ROLE_NAMES.OWNER}>
            {ownerLabel}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value={SYSTEM_ROLE_NAMES.ADMIN}>
            {adminLabel}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value={SYSTEM_ROLE_NAMES.MEMBER}>
            {memberLabel}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function mapActionError(
  err: unknown,
  t: ReturnType<typeof useTranslations<'Spaces.members'>>
): string {
  if (err instanceof ApiError && err.problem?.code) {
    const code = err.problem.code;
    if (isMemberErrorCode(code)) {
      return t(`errors.${code}`);
    }
  }
  return t('actionFailed');
}

type MemberRowProps = {
  member: SpaceMember;
  isSelf: boolean;
  canWrite: boolean;
  canChangeRoles: boolean;
  assignableRoles: SpaceRoleOption[];
  roleChangeBusy: boolean;
  onChangeRole: (member: SpaceMember, roleId: string) => void;
  canLeave: boolean;
  statusLabel: string;
  onAction: (action: PendingAction) => void;
  actionsLabel: string;
  youLabel: string;
  deactivateLabel: string;
  reactivateLabel: string;
  removeLabel: string;
  leaveLabel: string;
  rolePlaceholder: string;
};

function MemberRow({
  member,
  isSelf,
  canWrite,
  canChangeRoles,
  assignableRoles,
  roleChangeBusy,
  onChangeRole,
  canLeave,
  statusLabel,
  onAction,
  actionsLabel,
  youLabel,
  deactivateLabel,
  reactivateLabel,
  removeLabel,
  leaveLabel,
  rolePlaceholder,
}: MemberRowProps) {
  const roleLabel = useRoleLabel(member.role.name);
  const roleLabelId = useId();
  const isOwner = member.role.name === SYSTEM_ROLE_NAMES.OWNER;
  const showAdminActions = canWrite && !isOwner && !isSelf;
  const showRolePicker = canChangeRoles && !isOwner && !isSelf;
  const showLeave = canLeave;
  const showMenu = showAdminActions || showLeave;
  const pickerRoles = showRolePicker
    ? assignableRoles.some((role) => role.id === member.role.id)
      ? assignableRoles
      : [
          ...assignableRoles,
          {
            id: member.role.id,
            name: member.role.name,
            permissions: [] as string[],
            isSystem: false,
            isDefault: false,
            memberCount: 0,
          },
        ]
    : [];

  return (
    <TableRow
      className={cn(
        member.membershipStatus === 'deactivated' && 'text-muted-foreground'
      )}
    >
      <TableCell>
        <span className="flex min-w-0 items-center gap-3">
          <UserAvatar
            name={member.name}
            userId={member.userId}
            image={member.image}
            size="sm"
          />
          <span className="min-w-0">
            <span className="block truncate font-medium text-foreground">
              {member.name}
              {isSelf ? (
                <span className="ms-1.5 font-normal text-muted-foreground">
                  ({youLabel})
                </span>
              ) : null}
            </span>
            <span className="mt-0.5 block truncate text-xs text-muted-foreground sm:hidden">
              {member.email}
            </span>
          </span>
        </span>
      </TableCell>
      <TableCell className="hidden max-w-56 truncate sm:table-cell">
        {member.email}
      </TableCell>
      <TableCell className="whitespace-nowrap">
        {showRolePicker ? (
          <>
            <span id={roleLabelId} className="sr-only">
              {rolePlaceholder}
            </span>
            <RoleSelect
              labelledBy={roleLabelId}
              value={member.role.id}
              roles={pickerRoles}
              disabled={roleChangeBusy}
              onValueChange={(roleId) => onChangeRole(member, roleId)}
              placeholder={rolePlaceholder}
              className="min-w-36"
            />
          </>
        ) : (
          roleLabel
        )}
      </TableCell>
      <TableCell className="hidden whitespace-nowrap md:table-cell">
        {statusLabel}
      </TableCell>
      <TableCell className="hidden whitespace-nowrap lg:table-cell">
        <time dateTime={member.createdAt}>
          {new Date(member.createdAt).toLocaleDateString()}
        </time>
      </TableCell>
      <TableCell className="text-end">
        {showMenu ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label={actionsLabel}
              className={cn(
                'inline-flex size-8 items-center justify-center rounded-lg outline-none',
                'hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring'
              )}
            >
              <MoreHorizontalIcon className="size-4" aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44">
              {showAdminActions && member.membershipStatus === 'active' ? (
                <DropdownMenuItem
                  onClick={() => onAction({ type: 'deactivate', member })}
                >
                  {deactivateLabel}
                </DropdownMenuItem>
              ) : null}
              {showAdminActions &&
              member.membershipStatus === 'deactivated' ? (
                <DropdownMenuItem
                  onClick={() => onAction({ type: 'reactivate', member })}
                >
                  {reactivateLabel}
                </DropdownMenuItem>
              ) : null}
              {showAdminActions ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => onAction({ type: 'remove', member })}
                  >
                    {removeLabel}
                  </DropdownMenuItem>
                </>
              ) : null}
              {showLeave ? (
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onAction({ type: 'leave' })}
                >
                  {leaveLabel}
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </TableCell>
    </TableRow>
  );
}

type ConfirmDialogProps = {
  pending: PendingAction;
  open: boolean;
  busy: boolean;
  error: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  t: ReturnType<typeof useTranslations<'Spaces.members'>>;
};

function ConfirmDialog({
  pending,
  open,
  busy,
  error,
  onOpenChange,
  onConfirm,
  t,
}: ConfirmDialogProps) {
  const title =
    pending?.type === 'leave'
      ? t('confirmLeaveTitle')
      : pending?.type === 'deactivate'
        ? t('confirmDeactivateTitle')
        : pending?.type === 'reactivate'
          ? t('confirmReactivateTitle')
          : pending?.type === 'remove'
            ? t('confirmRemoveTitle')
            : '';

  const description =
    pending?.type === 'leave'
      ? t('confirmLeaveDescription')
      : pending?.type === 'deactivate'
        ? t('confirmDeactivateDescription', {
            name: pending.member.name,
          })
        : pending?.type === 'reactivate'
          ? t('confirmReactivateDescription', {
              name: pending.member.name,
            })
          : pending?.type === 'remove'
            ? t('confirmRemoveDescription', {
                name: pending.member.name,
              })
            : '';

  const confirmLabel =
    pending?.type === 'leave'
      ? t('leave')
      : pending?.type === 'deactivate'
        ? t('deactivate')
        : pending?.type === 'reactivate'
          ? t('reactivate')
          : t('remove');

  const destructive =
    pending?.type === 'leave' ||
    pending?.type === 'remove' ||
    pending?.type === 'deactivate';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent variant="modal">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription className="mt-2">{description}</DialogDescription>
        {error ? (
          <p className="mt-3 text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-5 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => onOpenChange(false)}
          >
            {t('cancel')}
          </Button>
          <Button
            type="button"
            variant={destructive ? 'destructive' : 'default'}
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? t('working') : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
