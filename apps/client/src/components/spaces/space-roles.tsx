'use client';

import {
  MAX_CUSTOM_ROLES,
  PERMISSION_LIST,
  PERMISSIONS,
  SYSTEM_ROLE_NAMES,
  permissionsAreSubset,
  type Permission,
} from '@work-hub/constants';
import type { SpaceRoleOption } from '@work-hub/contracts';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { LogoLoader } from '@/components/brand/logo-loader';
import { PageHeader } from '@/components/shell/page-header';
import { RequireSpacePermission } from '@/components/shell/require-space-permission';
import { PermissionTree } from '@/components/spaces/permission-tree';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRoleLabel } from '@/hooks/use-role-label';
import { useRoleActions, useSpaceRoles } from '@/hooks/use-roles';
import { useCurrentSpace } from '@/hooks/use-space';
import { ApiError } from '@/lib/api/fetch';
import { cn } from '@/lib/utils';

const ROLE_ERROR_CODES = [
  'ROLE_ESCALATION',
  'SYSTEM_ROLE_LOCKED',
  'ROLE_IN_USE',
  'ROLE_LIMIT_REACHED',
  'CONFLICT',
] as const;

type RoleErrorCode = (typeof ROLE_ERROR_CODES)[number];

function isRoleErrorCode(value: string): value is RoleErrorCode {
  return (ROLE_ERROR_CODES as readonly string[]).includes(value);
}

/** Roles and permissions settings (WH-011). */
export function SpaceRoles() {
  return (
    <RequireSpacePermission permission={PERMISSIONS.ROLES_WRITE}>
      <SpaceRolesBody />
    </RequireSpacePermission>
  );
}

function SpaceRolesBody() {
  const t = useTranslations('Spaces.roles');
  const { space } = useCurrentSpace();
  const rolesQuery = useSpaceRoles(space?.id);
  const actions = useRoleActions(space?.id ?? '');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SpaceRoleOption | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const roles = rolesQuery.data?.items ?? [];
  const customRoleCount = roles.filter((role) => !role.isSystem).length;
  const atCustomRoleLimit = customRoleCount >= MAX_CUSTOM_ROLES;

  useEffect(() => {
    if (selectedId || creating || roles.length === 0) {
      return;
    }
    setSelectedId(roles[0]?.id ?? null);
  }, [roles, selectedId, creating]);

  useEffect(() => {
    if (creating && atCustomRoleLimit) {
      setCreating(false);
    }
  }, [creating, atCustomRoleLimit]);

  const selected = roles.find((role) => role.id === selectedId) ?? null;

  if (!space) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t('title')} description={t('description')} />

      {rolesQuery.isPending ? (
        <div className="flex justify-center py-12">
          <LogoLoader size="lg" showLabel label={t('loading')} />
        </div>
      ) : null}

      {rolesQuery.isError ? (
        <p className="text-sm text-destructive" role="alert">
          {t('failed')}
        </p>
      ) : null}

      {!rolesQuery.isPending && !rolesQuery.isError ? (
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <aside className="flex w-full flex-col gap-3 lg:max-w-xs">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-medium text-foreground">
                {t('listHeading')}
              </h2>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={atCustomRoleLimit}
                title={
                  atCustomRoleLimit
                    ? t('limitReached', { max: MAX_CUSTOM_ROLES })
                    : undefined
                }
                onClick={() => {
                  setCreating(true);
                  setSelectedId(null);
                  setError(null);
                }}
              >
                {t('create')}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('templateCount', {
                count: customRoleCount,
                max: MAX_CUSTOM_ROLES,
              })}
            </p>
            <ul className="flex flex-col gap-1">
              {roles.map((role) => (
                <RoleListItem
                  key={role.id}
                  role={role}
                  active={!creating && role.id === selectedId}
                  onSelect={() => {
                    setCreating(false);
                    setSelectedId(role.id);
                    setError(null);
                  }}
                  membersLabel={t('memberCount', { count: role.memberCount })}
                  defaultLabel={t('defaultBadge')}
                />
              ))}
            </ul>
          </aside>

          <div className="min-w-0 flex-1">
            {creating ? (
              <RoleEditor
                mode="create"
                actorPermissions={space.permissions}
                spaceRoleName={space.roleName}
                busy={actions.create.isPending}
                error={error}
                onCancel={() => {
                  setCreating(false);
                  setSelectedId(roles[0]?.id ?? null);
                  setError(null);
                }}
                onSave={async (draft) => {
                  setError(null);
                  try {
                    const created = await actions.create.mutateAsync(draft);
                    setCreating(false);
                    setSelectedId(created.id);
                  } catch (err) {
                    setError(mapRoleError(err, t));
                  }
                }}
              />
            ) : selected ? (
              <RoleEditor
                mode="edit"
                role={selected}
                actorPermissions={space.permissions}
                spaceRoleName={space.roleName}
                busy={
                  actions.update.isPending || actions.remove.isPending
                }
                error={error}
                onSave={async (draft) => {
                  setError(null);
                  const body = {
                    name:
                      draft.name !== selected.name ? draft.name : undefined,
                    permissions: samePermissions(
                      draft.permissions,
                      selected.permissions
                    )
                      ? undefined
                      : draft.permissions,
                    isDefault:
                      draft.isDefault !== selected.isDefault
                        ? draft.isDefault
                        : undefined,
                  };
                  if (
                    body.name === undefined &&
                    body.permissions === undefined &&
                    body.isDefault === undefined
                  ) {
                    return;
                  }
                  try {
                    await actions.update.mutateAsync({
                      roleId: selected.id,
                      body,
                    });
                  } catch (err) {
                    setError(mapRoleError(err, t));
                  }
                }}
                onDelete={() => setDeleteTarget(selected)}
              />
            ) : (
              <p className="text-sm text-muted-foreground">{t('empty')}</p>
            )}
          </div>
        </div>
      ) : null}

      <DeleteRoleDialog
        role={deleteTarget}
        open={Boolean(deleteTarget)}
        busy={actions.remove.isPending}
        error={error}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
            setError(null);
          }
        }}
        onConfirm={async () => {
          if (!deleteTarget) {
            return;
          }
          setError(null);
          try {
            await actions.remove.mutateAsync(deleteTarget.id);
            setDeleteTarget(null);
            setSelectedId(roles.find((r) => r.id !== deleteTarget.id)?.id ?? null);
          } catch (err) {
            setError(mapRoleError(err, t));
          }
        }}
      />
    </div>
  );
}

function RoleListItem({
  role,
  active,
  onSelect,
  membersLabel,
  defaultLabel,
}: {
  role: SpaceRoleOption;
  active: boolean;
  onSelect: () => void;
  membersLabel: string;
  defaultLabel: string;
}) {
  const label = useRoleLabel(role.name);
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          'flex w-full flex-col items-start gap-0.5 rounded-lg px-3 py-2 text-start transition-colors',
          active
            ? 'bg-muted text-foreground'
            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
        )}
      >
        <span className="flex w-full items-center justify-between gap-2">
          <span className="truncate text-sm font-medium">{label}</span>
          {role.isDefault ? (
            <span className="shrink-0 text-xs text-muted-foreground">
              {defaultLabel}
            </span>
          ) : null}
        </span>
        <span className="text-xs text-muted-foreground">{membersLabel}</span>
      </button>
    </li>
  );
}

type RoleDraft = {
  name: string;
  permissions: Permission[];
  isDefault: boolean;
};

function RoleEditor({
  mode,
  role,
  actorPermissions,
  spaceRoleName,
  busy,
  error,
  onSave,
  onCancel,
  onDelete,
}: {
  mode: 'create' | 'edit';
  role?: SpaceRoleOption;
  actorPermissions: readonly string[];
  spaceRoleName: string;
  busy: boolean;
  error: string | null;
  onSave: (draft: RoleDraft) => Promise<void>;
  onCancel?: () => void;
  onDelete?: () => void;
}) {
  const t = useTranslations('Spaces.roles');
  const roleLabel = useRoleLabel(role?.name ?? '');
  const isOwner = role?.name === SYSTEM_ROLE_NAMES.OWNER;
  const isSystem = role?.isSystem ?? false;
  const isOwnRole =
    mode === 'edit' && Boolean(role && role.name === spaceRoleName);
  const aboveActor =
    mode === 'edit' &&
    Boolean(
      role && !permissionsAreSubset(role.permissions, actorPermissions)
    );
  const nameLocked = mode === 'edit' && (isSystem || isOwnRole || aboveActor);
  const permissionsLocked = isOwner || isOwnRole || aboveActor;

  const [name, setName] = useState(role?.name ?? '');
  const [permissions, setPermissions] = useState<Permission[]>(
    (role?.permissions ?? [PERMISSIONS.MEMBERS_READ]) as Permission[]
  );
  const [isDefault, setIsDefault] = useState(role?.isDefault ?? false);

  useEffect(() => {
    setName(role?.name ?? '');
    setPermissions(
      (role?.permissions ?? [PERMISSIONS.MEMBERS_READ]) as Permission[]
    );
    setIsDefault(role?.isDefault ?? false);
  }, [role]);

  const grantable = useMemo(
    () =>
      new Set(
        PERMISSION_LIST.filter((permission) =>
          permissionsAreSubset([permission], actorPermissions)
        )
      ),
    [actorPermissions]
  );

  function togglePermission(permission: Permission) {
    if (permissionsLocked || !grantable.has(permission)) {
      return;
    }
    setPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((item) => item !== permission)
        : [...prev, permission]
    );
  }

  function toggleBranch(leaves: Permission[], checked: boolean) {
    if (permissionsLocked) {
      return;
    }
    setPermissions((prev) => {
      const next = new Set(prev);
      for (const leaf of leaves) {
        if (!grantable.has(leaf)) {
          continue;
        }
        if (checked) {
          next.add(leaf);
        } else {
          next.delete(leaf);
        }
      }
      return [...next];
    });
  }

  const grantableList = useMemo(
    () => PERMISSION_LIST.filter((permission) => grantable.has(permission)),
    [grantable]
  );
  const selectedGrantableCount = grantableList.filter((permission) =>
    permissions.includes(permission)
  ).length;
  const allGrantableSelected =
    grantableList.length > 0 &&
    selectedGrantableCount === grantableList.length;
  const noneGrantableSelected = selectedGrantableCount === 0;

  function selectAllPermissions() {
    if (permissionsLocked || busy) {
      return;
    }
    setPermissions(grantableList);
  }

  function deselectAllPermissions() {
    if (permissionsLocked || busy) {
      return;
    }
    setPermissions((prev) => prev.filter((permission) => !grantable.has(permission)));
  }

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        void onSave({
          name: name.trim(),
          permissions,
          isDefault,
        });
      }}
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-medium text-foreground">
          {mode === 'create' ? t('createTitle') : roleLabel}
        </h2>
        {mode === 'edit' && role ? (
          <p className="text-sm text-muted-foreground">
            {t('memberCount', { count: role.memberCount })}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="role-name">{t('nameLabel')}</Label>
        <Input
          id="role-name"
          value={name}
          onValueChange={setName}
          disabled={nameLocked || busy}
          maxLength={100}
          required
        />
        {nameLocked ? (
          <p className="text-xs text-muted-foreground">{t('systemNameHint')}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-foreground">
            {t('permissionsHeading')}
          </p>
          {!permissionsLocked ? (
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={busy || allGrantableSelected || grantableList.length === 0}
                onClick={selectAllPermissions}
              >
                {t('selectAll')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={busy || noneGrantableSelected}
                onClick={deselectAllPermissions}
              >
                {t('deselectAll')}
              </Button>
            </div>
          ) : null}
        </div>
        {isOwner ? (
          <p className="text-sm text-muted-foreground">{t('ownerLocked')}</p>
        ) : null}
        {isOwnRole ? (
          <p className="text-sm text-muted-foreground">{t('ownRoleLocked')}</p>
        ) : null}
        {aboveActor && !isOwnRole ? (
          <p className="text-sm text-muted-foreground">{t('aboveActorLocked')}</p>
        ) : null}
        <PermissionTree
          selected={permissions}
          grantable={grantable}
          locked={permissionsLocked}
          busy={busy}
          onToggleLeaf={togglePermission}
          onToggleBranch={toggleBranch}
        />
      </div>

      {!isOwner ? (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="size-4 accent-foreground"
            checked={isDefault}
            disabled={
              busy || (mode === 'edit' && Boolean(role?.isDefault) && isDefault)
            }
            onChange={(event) => setIsDefault(event.target.checked)}
          />
          <span>{t('defaultLabel')}</span>
        </label>
      ) : null}

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {!permissionsLocked ? (
          <Button
            type="submit"
            disabled={busy || !name.trim() || permissions.length === 0}
          >
            {busy ? t('saving') : t('save')}
          </Button>
        ) : null}
        {mode === 'create' && onCancel ? (
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={onCancel}
          >
            {t('cancel')}
          </Button>
        ) : null}
        {mode === 'edit' && !isSystem && !permissionsLocked && onDelete ? (
          <Button
            type="button"
            variant="destructive"
            disabled={busy}
            className="ms-auto"
            onClick={onDelete}
          >
            {t('delete')}
          </Button>
        ) : null}
      </div>
    </form>
  );
}

function DeleteRoleDialog({
  role,
  open,
  busy,
  error,
  onOpenChange,
  onConfirm,
}: {
  role: SpaceRoleOption | null;
  open: boolean;
  busy: boolean;
  error: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const t = useTranslations('Spaces.roles');
  const label = useRoleLabel(role?.name ?? '');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{t('confirmDeleteTitle')}</DialogTitle>
        <DialogDescription>
          {t('confirmDeleteDescription', { name: label })}
        </DialogDescription>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-4 flex justify-end gap-2">
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
            variant="destructive"
            disabled={busy}
            onClick={() => void onConfirm()}
          >
            {busy ? t('saving') : t('delete')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function samePermissions(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  const left = new Set(a);
  return b.every((item) => left.has(item));
}

function mapRoleError(
  err: unknown,
  t: ReturnType<typeof useTranslations<'Spaces.roles'>>
): string {
  if (err instanceof ApiError && err.problem?.code) {
    const code = err.problem.code;
    if (isRoleErrorCode(code)) {
      return t(`errors.${code}`);
    }
  }
  return t('actionFailed');
}
