'use client';

import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { AvatarCropDialog } from '@/components/account/avatar-crop-dialog';
import { UserAvatar } from '@/components/account/user-avatar';
import { buttonVariants } from '@/components/ui/button-variants';
import { useAuth } from '@/hooks/use-auth';
import { deleteAvatar, uploadAvatar } from '@/lib/api/avatar';
import { ApiError } from '@/lib/api/fetch';
import { queryKeys } from '@/lib/api/query-keys';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';

const MAX_BYTES = 2 * 1024 * 1024;
const ACCEPTED = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function SettingsAvatar() {
  const t = useTranslations('Account.settings.avatar');
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return null;
  }

  function mapError(err: unknown): string {
    if (err instanceof ApiError && err.problem?.code) {
      if (err.problem.code === 'IMAGE_TOO_LARGE') {
        return t('errors.tooLarge');
      }
      if (err.problem.code === 'IMAGE_UNSUPPORTED_TYPE') {
        return t('errors.unsupported');
      }
      if (err.problem.code === 'IMAGE_TOO_SMALL') {
        return t('errors.tooSmall');
      }
    }
    return t('errors.failed');
  }

  function onPick(picked: File | undefined) {
    if (!picked) {
      return;
    }
    if (!ACCEPTED.has(picked.type)) {
      setError(t('errors.unsupported'));
      return;
    }
    if (picked.size > MAX_BYTES) {
      setError(t('errors.tooLarge'));
      return;
    }
    setError(null);
    setFile(picked);
  }

  async function onConfirm(blob: Blob) {
    setBusy(true);
    setError(null);
    try {
      await uploadAvatar(blob);
      // get-session does not refresh useSession(); notify the session store (WH-050).
      authClient.$store.notify('$sessionSignal');
      await queryClient.invalidateQueries({ queryKey: queryKeys.me });
      setFile(null);
    } catch (err) {
      setError(mapError(err));
    } finally {
      setBusy(false);
    }
  }

  async function onRemove() {
    setBusy(true);
    setError(null);
    try {
      await deleteAvatar();
      authClient.$store.notify('$sessionSignal');
      await queryClient.invalidateQueries({ queryKey: queryKeys.me });
    } catch (err) {
      setError(mapError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-medium text-foreground">{t('title')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <UserAvatar
          name={user.name}
          userId={user.id}
          image={user.image}
          size="lg"
          className="size-24 text-2xl"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={cn(buttonVariants({ size: 'sm' }))}
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {t('change')}
          </button>
          {user.image ? (
            <button
              type="button"
              className={cn(buttonVariants({ size: 'sm', variant: 'outline' }))}
              disabled={busy}
              onClick={() => void onRemove()}
            >
              {t('remove')}
            </button>
          ) : null}
        </div>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={(e) => {
          onPick(e.target.files?.[0]);
          e.target.value = '';
        }}
      />

      {file ? (
        <AvatarCropDialog
          file={file}
          open
          busy={busy}
          onCancel={() => setFile(null)}
          onConfirm={(blob) => void onConfirm(blob)}
        />
      ) : null}
    </section>
  );
}
