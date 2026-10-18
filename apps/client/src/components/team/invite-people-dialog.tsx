'use client';

import { CheckIcon, ChevronDownIcon, CopyIcon, XIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useId, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button-variants';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useInviteActions, useSpaceRoles } from '@/hooks/use-invites';
import { useRoleLabel } from '@/hooks/use-role-label';
import { ApiError } from '@/lib/api/fetch';
import { parseInviteEmails } from '@/lib/team/parse-invite-emails';
import { cn } from '@/lib/utils';

const fieldTriggerClassName = cn(
  buttonVariants({ variant: 'outline' }),
  'w-full justify-between gap-2 px-2.5 font-normal'
);

type InviteMode = 'email' | 'link';

type InvitePeopleDialogProps = {
  spaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function InvitePeopleDialog({
  spaceId,
  open,
  onOpenChange,
}: InvitePeopleDialogProps) {
  const t = useTranslations('Team.inviteDialog');
  const tInvites = useTranslations('Spaces.invites');
  const actions = useInviteActions(spaceId);
  const rolesQuery = useSpaceRoles(open ? spaceId : undefined);
  const baseId = useId();

  const [mode, setMode] = useState<InviteMode>('email');
  const [chipInput, setChipInput] = useState('');
  const [emails, setEmails] = useState<string[]>([]);
  const [roleId, setRoleId] = useState('');
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [maxUses, setMaxUses] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [emailSummary, setEmailSummary] = useState<string | null>(null);
  const [createdLink, setCreatedLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    if (!open) {
      setMode('email');
      setChipInput('');
      setEmails([]);
      setRoleId('');
      setExpiresInDays(7);
      setMaxUses(10);
      setError(null);
      setEmailSummary(null);
      setCreatedLink(null);
      setLinkCopied(false);
    }
  }, [open]);

  useEffect(() => {
    if (roleId || !rolesQuery.data?.items.length) {
      return;
    }
    const preferred =
      rolesQuery.data.items.find((role) => role.isDefault) ??
      rolesQuery.data.items[0];
    if (preferred) {
      setRoleId(preferred.id);
    }
  }, [roleId, rolesQuery.data]);

  function commitChips(raw: string) {
    const next = parseInviteEmails(raw);
    if (next.length === 0) {
      return;
    }
    setEmails((prev) => {
      const seen = new Set(prev.map((e) => e.toLowerCase()));
      const merged = [...prev];
      for (const email of next) {
        const key = email.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(email);
        }
      }
      return merged;
    });
    setChipInput('');
  }

  function onChipKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',' || event.key === ' ') {
      event.preventDefault();
      commitChips(chipInput);
    } else if (event.key === 'Backspace' && !chipInput && emails.length > 0) {
      setEmails((prev) => prev.slice(0, -1));
    }
  }

  async function onSubmitEmail(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setEmailSummary(null);
    const pendingInput = parseInviteEmails(chipInput);
    const all = [...emails];
    for (const email of pendingInput) {
      if (!all.some((e) => e.toLowerCase() === email.toLowerCase())) {
        all.push(email);
      }
    }
    if (all.length === 0) {
      setError(t('emailRequired'));
      return;
    }
    try {
      const result = await actions.create.mutateAsync({
        kind: 'email',
        emails: all,
        roleId: roleId || undefined,
        maxUses: 1,
        expiresInDays: 7,
      });
      if (!('results' in result)) {
        return;
      }
      const created = result.results.filter((r) => r.status === 'created').length;
      const skipped = result.results.length - created;
      setEmailSummary(t('emailSummary', { created, skipped }));
      setEmails([]);
      setChipInput('');
    } catch (err) {
      setError(mapError(err, tInvites, t('failed')));
    }
  }

  async function onCreateLink() {
    setError(null);
    setCreatedLink(null);
    setLinkCopied(false);
    try {
      const result = await actions.create.mutateAsync({
        kind: 'link',
        roleId: roleId || undefined,
        maxUses,
        expiresInDays,
      });
      if ('url' in result && result.url) {
        setCreatedLink(result.url);
      }
    } catch (err) {
      setError(mapError(err, tInvites, t('failed')));
    }
  }

  async function onCopyLink() {
    if (!createdLink) {
      return;
    }
    try {
      await navigator.clipboard.writeText(createdLink);
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      setError(tInvites('copyFailed'));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent variant="modal" className="max-w-lg">
        <DialogTitle>{t('title')}</DialogTitle>
        <DialogDescription className="mt-1">{t('description')}</DialogDescription>

        <div
          role="tablist"
          aria-label={t('modeLabel')}
          className="mt-4 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1"
        >
          {(['email', 'link'] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="tab"
              id={`${baseId}-tab-${value}`}
              aria-selected={mode === value}
              aria-controls={`${baseId}-panel-${value}`}
              className={cn(
                'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                mode === value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => setMode(value)}
            >
              {value === 'email' ? t('byEmail') : t('shareLink')}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <Label id={`${baseId}-role-label`}>{t('role')}</Label>
          <RoleSelect
            labelledBy={`${baseId}-role-label`}
            value={roleId}
            roles={rolesQuery.data?.items ?? []}
            disabled={rolesQuery.isLoading}
            onValueChange={setRoleId}
            placeholder={t('role')}
          />
        </div>

        {mode === 'email' ? (
          <form
            id={`${baseId}-panel-email`}
            role="tabpanel"
            aria-labelledby={`${baseId}-tab-email`}
            className="mt-4 flex flex-col gap-4"
            onSubmit={(event) => void onSubmitEmail(event)}
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${baseId}-emails`}>{t('emails')}</Label>
              <div
                className="flex min-h-8 flex-wrap items-center gap-1.5 rounded-lg border border-input px-2 py-1 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50"
                dir="ltr"
              >
                {emails.map((email) => (
                  <span
                    key={email}
                    className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs text-foreground"
                  >
                    {email}
                    <button
                      type="button"
                      className="rounded-sm text-muted-foreground hover:text-foreground"
                      aria-label={t('removeEmail', { email })}
                      onClick={() =>
                        setEmails((prev) => prev.filter((e) => e !== email))
                      }
                    >
                      <XIcon className="size-3" aria-hidden />
                    </button>
                  </span>
                ))}
                <Input
                  id={`${baseId}-emails`}
                  value={chipInput}
                  onValueChange={setChipInput}
                  onKeyDown={onChipKeyDown}
                  onBlur={() => commitChips(chipInput)}
                  placeholder={t('emailsPlaceholder')}
                  className="h-7 min-w-40 flex-1 border-0 px-1 shadow-none focus-visible:ring-0"
                  autoComplete="off"
                />
              </div>
              <p className="text-xs text-muted-foreground">{t('emailsHint')}</p>
            </div>
            {emailSummary ? (
              <p className="text-sm text-muted-foreground" role="status">
                {emailSummary}
              </p>
            ) : null}
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t('close')}
              </Button>
              <Button type="submit" disabled={actions.create.isPending}>
                {actions.create.isPending ? tInvites('sending') : t('send')}
              </Button>
            </div>
          </form>
        ) : (
          <div
            id={`${baseId}-panel-link`}
            role="tabpanel"
            aria-labelledby={`${baseId}-tab-link`}
            className="mt-4 flex flex-col gap-4"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label id={`${baseId}-expires-label`}>{t('expiresIn')}</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    aria-labelledby={`${baseId}-expires-label`}
                    className={fieldTriggerClassName}
                  >
                    <span>{t('days', { count: expiresInDays })}</span>
                    <ChevronDownIcon
                      className="size-3.5 opacity-70"
                      aria-hidden
                    />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-36">
                    <DropdownMenuRadioGroup
                      value={String(expiresInDays)}
                      onValueChange={(value) =>
                        setExpiresInDays(Number(value) || 7)
                      }
                    >
                      {[1, 7, 30].map((days) => (
                        <DropdownMenuRadioItem key={days} value={String(days)}>
                          {t('days', { count: days })}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor={`${baseId}-uses`}>{t('maxUses')}</Label>
                <Input
                  id={`${baseId}-uses`}
                  type="number"
                  min={1}
                  max={1000}
                  value={String(maxUses)}
                  onValueChange={(value) => setMaxUses(Number(value) || 1)}
                />
              </div>
            </div>
            {createdLink ? (
              <div className="flex flex-col gap-2 rounded-lg border border-border bg-secondary/60 px-3 py-2 text-sm">
                <p className="text-muted-foreground">{tInvites('linkCreated')}</p>
                <p className="break-all font-medium" dir="ltr">
                  {createdLink}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void onCopyLink()}
                  >
                    {linkCopied ? (
                      <CheckIcon data-icon="inline-start" aria-hidden />
                    ) : (
                      <CopyIcon data-icon="inline-start" aria-hidden />
                    )}
                    {linkCopied ? tInvites('copied') : tInvites('copyLink')}
                  </Button>
                  <span className="sr-only" aria-live="polite">
                    {linkCopied ? tInvites('copied') : ''}
                  </span>
                </div>
              </div>
            ) : null}
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t('close')}
              </Button>
              <Button
                type="button"
                disabled={actions.create.isPending}
                onClick={() => void onCreateLink()}
              >
                {actions.create.isPending
                  ? tInvites('sending')
                  : tInvites('createLink')}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function RoleSelect({
  labelledBy,
  value,
  roles,
  disabled,
  onValueChange,
  placeholder,
}: {
  labelledBy: string;
  value: string;
  roles: { id: string; name: string }[];
  disabled?: boolean;
  onValueChange: (value: string) => void;
  placeholder: string;
}) {
  const selected = roles.find((role) => role.id === value);
  const selectedLabel = useRoleLabel(selected?.name ?? '');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-labelledby={labelledBy}
        disabled={disabled || roles.length === 0}
        className={fieldTriggerClassName}
      >
        <span className="truncate">
          {selected ? selectedLabel : placeholder}
        </span>
        <ChevronDownIcon className="size-3.5 shrink-0 opacity-70" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-44">
        <DropdownMenuRadioGroup value={value} onValueChange={onValueChange}>
          {roles.map((role) => (
            <RoleRadioItem key={role.id} id={role.id} name={role.name} />
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function RoleRadioItem({ id, name }: { id: string; name: string }) {
  const label = useRoleLabel(name);
  return (
    <DropdownMenuRadioItem value={id}>{label}</DropdownMenuRadioItem>
  );
}

function mapError(
  err: unknown,
  tInvites: ReturnType<typeof useTranslations<'Spaces.invites'>>,
  fallback: string
): string {
  if (err instanceof ApiError && err.problem?.code) {
    const code = err.problem.code;
    if (
      code === 'ALREADY_MEMBER' ||
      code === 'CONFLICT' ||
      code === 'INVITE_NOT_FOUND'
    ) {
      return tInvites(`errors.${code}`);
    }
  }
  return fallback;
}
