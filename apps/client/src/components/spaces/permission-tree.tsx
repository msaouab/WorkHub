'use client';

import { PERMISSION_LIST, type Permission } from '@work-hub/constants';
import { ChevronRightIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

type PermissionTreeNode = {
  /** Dotted path for this node (`space`, `space.settings`, …). */
  path: string;
  segment: string;
  /** Set when this node is a grantable leaf permission. */
  permission?: Permission;
  children: PermissionTreeNode[];
};

/** Build a tree from dotted permission ids, preserving catalog order. */
export function buildPermissionTree(
  catalog: readonly Permission[] = PERMISSION_LIST
): PermissionTreeNode[] {
  const roots: PermissionTreeNode[] = [];
  const byPath = new Map<string, PermissionTreeNode>();

  for (const permission of catalog) {
    const segments = permission.split('.');
    let path = '';
    let parentChildren = roots;

    for (const [index, segment] of segments.entries()) {
      if (segment === undefined) continue;
      path = path ? `${path}.${segment}` : segment;
      let node = byPath.get(path);
      if (!node) {
        node = { path, segment, children: [] };
        byPath.set(path, node);
        parentChildren.push(node);
      }
      if (index === segments.length - 1) {
        node.permission = permission;
      }
      parentChildren = node.children;
    }
  }

  return roots;
}

const PERMISSION_TREE = buildPermissionTree();

/** Root branches start open; nested branches start closed. */
function initialExpandedPaths(tree: PermissionTreeNode[]): Set<string> {
  return new Set(tree.map((node) => node.path));
}

type PermissionTreeProps = {
  selected: readonly string[];
  grantable: ReadonlySet<string>;
  locked: boolean;
  busy: boolean;
  onToggleLeaf: (permission: Permission) => void;
  onToggleBranch: (leaves: Permission[], checked: boolean) => void;
};

export function PermissionTree({
  selected,
  grantable,
  locked,
  busy,
  onToggleLeaf,
  onToggleBranch,
}: PermissionTreeProps) {
  const t = useTranslations('Spaces.roles');
  const selectedSet = new Set(selected);
  const [expanded, setExpanded] = useState(() =>
    initialExpandedPaths(PERMISSION_TREE)
  );

  function toggleExpanded(path: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }

  return (
    <ul
      className="flex flex-col gap-1"
      role="tree"
      aria-label={t('permissionsHeading')}
    >
      {PERMISSION_TREE.map((node) => (
        <PermissionTreeItem
          key={node.path}
          node={node}
          depth={0}
          selected={selectedSet}
          grantable={grantable}
          locked={locked}
          busy={busy}
          expanded={expanded}
          onToggleExpanded={toggleExpanded}
          onToggleLeaf={onToggleLeaf}
          onToggleBranch={onToggleBranch}
        />
      ))}
    </ul>
  );
}

function PermissionTreeItem({
  node,
  depth,
  selected,
  grantable,
  locked,
  busy,
  expanded,
  onToggleExpanded,
  onToggleLeaf,
  onToggleBranch,
}: {
  node: PermissionTreeNode;
  depth: number;
  selected: ReadonlySet<string>;
  grantable: ReadonlySet<string>;
  locked: boolean;
  busy: boolean;
  expanded: ReadonlySet<string>;
  onToggleExpanded: (path: string) => void;
  onToggleLeaf: (permission: Permission) => void;
  onToggleBranch: (leaves: Permission[], checked: boolean) => void;
}) {
  const t = useTranslations('Spaces.roles');
  const leaves = collectLeaves(node);
  const grantableLeaves = leaves.filter((permission) =>
    grantable.has(permission)
  );
  const selectedCount = grantableLeaves.filter((permission) =>
    selected.has(permission)
  ).length;
  const allSelected =
    grantableLeaves.length > 0 && selectedCount === grantableLeaves.length;
  const someSelected = selectedCount > 0 && !allSelected;
  const leafPermission =
    node.children.length === 0 ? node.permission : undefined;
  const isLeaf = leafPermission !== undefined;
  const hasChildren = node.children.length > 0;
  const isOpen = hasChildren && expanded.has(node.path);
  const canInteract =
    !locked &&
    !busy &&
    (leafPermission !== undefined
      ? grantable.has(leafPermission)
      : grantableLeaves.length > 0);

  const label =
    leafPermission !== undefined
      ? t(`permissions.${leafPermission}` as 'permissions.members.read')
      : t(`tree.${node.segment}` as 'tree.space');

  return (
    <li
      role="treeitem"
      aria-selected={
        leafPermission !== undefined
          ? selected.has(leafPermission)
          : allSelected
      }
      aria-expanded={hasChildren ? isOpen : undefined}
      className="flex flex-col gap-1"
    >
      <div
        className={cn(
          'flex items-start gap-1.5 text-sm',
          depth > 0 && 'ps-1'
        )}
      >
        {hasChildren ? (
          <button
            type="button"
            className={cn(
              'mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-sm',
              'text-muted-foreground outline-none hover:bg-muted hover:text-foreground',
              'focus-visible:ring-2 focus-visible:ring-ring'
            )}
            aria-expanded={isOpen}
            aria-label={
              isOpen
                ? t('collapseBranch', { name: label })
                : t('expandBranch', { name: label })
            }
            onClick={() => onToggleExpanded(node.path)}
          >
            <ChevronRightIcon
              className={cn(
                'size-3.5 transition-transform',
                isOpen ? 'rotate-90' : 'rtl:rotate-180'
              )}
              aria-hidden
            />
          </button>
        ) : (
          <span className="mt-0.5 size-5 shrink-0" aria-hidden />
        )}
        <label
          className={cn(
            'flex min-w-0 flex-1 items-start gap-2',
            !canInteract && 'cursor-not-allowed opacity-60'
          )}
        >
          <TriStateCheckbox
            checked={
              leafPermission !== undefined
                ? selected.has(leafPermission)
                : allSelected
            }
            indeterminate={!isLeaf && someSelected}
            disabled={!canInteract}
            onChange={() => {
              if (leafPermission !== undefined) {
                onToggleLeaf(leafPermission);
                return;
              }
              onToggleBranch(grantableLeaves, !allSelected);
            }}
          />
          <span className={cn(!isLeaf && 'font-medium text-foreground')}>
            {label}
          </span>
        </label>
      </div>
      {hasChildren && isOpen ? (
        <ul
          role="group"
          className="ms-3 flex flex-col gap-1 border-s border-border ps-2"
        >
          {node.children.map((child) => (
            <PermissionTreeItem
              key={child.path}
              node={child}
              depth={depth + 1}
              selected={selected}
              grantable={grantable}
              locked={locked}
              busy={busy}
              expanded={expanded}
              onToggleExpanded={onToggleExpanded}
              onToggleLeaf={onToggleLeaf}
              onToggleBranch={onToggleBranch}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function collectLeaves(node: PermissionTreeNode): Permission[] {
  if (node.permission && node.children.length === 0) {
    return [node.permission];
  }
  return node.children.flatMap(collectLeaves);
}

function TriStateCheckbox({
  checked,
  indeterminate,
  disabled,
  onChange,
}: {
  checked: boolean;
  indeterminate: boolean;
  disabled: boolean;
  onChange: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      type="checkbox"
      className="mt-0.5 size-4 shrink-0 accent-foreground"
      checked={checked}
      disabled={disabled}
      onChange={onChange}
    />
  );
}
