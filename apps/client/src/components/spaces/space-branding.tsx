'use client';

import { useRef, useState, type CSSProperties } from 'react';
import { COVER_PRESETS, PERMISSIONS, type CoverPreset } from '@work-hub/constants';
import type { MeSpace } from '@work-hub/contracts';
import { useTranslations } from 'next-intl';
import { ApiError } from '@/lib/api/fetch';
import { COVER_PRESET_STYLES } from '@/lib/cover-presets';
import { buttonVariants } from '@/components/ui/button-variants';
import { SpaceLogo } from '@/components/spaces/space-logo';
import {
  useDeleteSpaceCover,
  useDeleteSpaceLogo,
  useUpdateSpaceCover,
  useUpdateSpaceLogo,
} from '@/hooks/use-space-branding';
import { cn } from '@/lib/utils';

const LOGO_MAX = 2 * 1024 * 1024;
const COVER_MAX = 5 * 1024 * 1024;
const ACCEPTED = new Set(['image/jpeg', 'image/png', 'image/webp']);

type SpaceBrandingProps = {
  space: MeSpace;
  /** Compact home layout vs settings section. */
  variant?: 'home' | 'settings';
};

export function SpaceBranding({
  space,
  variant = 'home',
}: SpaceBrandingProps) {
  const t = useTranslations('Spaces.branding');
  const canEdit = space.permissions.includes(PERMISSIONS.SPACE_SETTINGS_WRITE);
  const updateLogo = useUpdateSpaceLogo(space.id);
  const deleteLogo = useDeleteSpaceLogo(space.id);
  const updateCover = useUpdateSpaceCover(space.id);
  const deleteCover = useDeleteSpaceCover(space.id);
  const logoInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [reposition, setReposition] = useState(false);
  const [draftY, setDraftY] = useState(space.coverPositionY);

  const busy =
    updateLogo.isPending ||
    deleteLogo.isPending ||
    updateCover.isPending ||
    deleteCover.isPending;

  function mapError(err: unknown, fallback: string): string {
    if (err instanceof ApiError && err.problem?.code) {
      const code = err.problem.code;
      if (code === 'IMAGE_TOO_LARGE') {
        return t('errors.tooLarge');
      }
      if (code === 'IMAGE_UNSUPPORTED_TYPE') {
        return t('errors.unsupported');
      }
      if (code === 'IMAGE_TOO_SMALL') {
        return t('errors.tooSmall');
      }
    }
    return fallback;
  }

  function validateClient(file: File, maxBytes: number): string | null {
    if (!ACCEPTED.has(file.type)) {
      return t('errors.unsupported');
    }
    if (file.size > maxBytes) {
      return t('errors.tooLarge');
    }
    return null;
  }

  async function onLogoFile(file: File | undefined) {
    if (!file) {
      return;
    }
    const clientError = validateClient(file, LOGO_MAX);
    if (clientError) {
      setError(clientError);
      return;
    }
    setError(null);
    try {
      await updateLogo.mutateAsync(file);
    } catch (err) {
      setError(mapError(err, t('errors.logoFailed')));
    }
  }

  async function onCoverFile(file: File | undefined) {
    if (!file) {
      return;
    }
    const clientError = validateClient(file, COVER_MAX);
    if (clientError) {
      setError(clientError);
      return;
    }
    setError(null);
    try {
      await updateCover.mutateAsync(file);
    } catch (err) {
      setError(mapError(err, t('errors.coverFailed')));
    }
  }

  async function onPreset(preset: CoverPreset) {
    setError(null);
    try {
      await updateCover.mutateAsync({ preset });
    } catch (err) {
      setError(mapError(err, t('errors.coverFailed')));
    }
  }

  async function onRemoveCover() {
    setError(null);
    try {
      await deleteCover.mutateAsync();
    } catch (err) {
      setError(mapError(err, t('errors.coverFailed')));
    }
  }

  async function onRemoveLogo() {
    setError(null);
    try {
      await deleteLogo.mutateAsync();
    } catch (err) {
      setError(mapError(err, t('errors.logoFailed')));
    }
  }

  async function savePosition() {
    setError(null);
    try {
      await updateCover.mutateAsync({ positionY: draftY });
      setReposition(false);
    } catch (err) {
      setError(mapError(err, t('errors.coverFailed')));
    }
  }

  const coverStyle = coverBackground(space, reposition ? draftY : space.coverPositionY);

  return (
    <div className={cn('flex flex-col', variant === 'home' ? 'gap-0' : 'gap-4')}>
      <div className="group relative overflow-hidden rounded-2xl border border-border/60">
        <div
          className="relative h-[30vh] min-h-36 w-full bg-muted"
          style={coverStyle}
          role="img"
          aria-label=""
        />
        {canEdit ? (
          <div className="absolute inset-x-0 top-0 flex flex-wrap gap-2 p-3 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
            <button
              type="button"
              className={cn(buttonVariants({ size: 'sm', variant: 'secondary' }))}
              disabled={busy}
              onClick={() => coverInput.current?.click()}
            >
              {t('changeCover')}
            </button>
            {space.cover ? (
              <>
                <button
                  type="button"
                  className={cn(buttonVariants({ size: 'sm', variant: 'secondary' }))}
                  disabled={busy}
                  onClick={() => {
                    setDraftY(space.coverPositionY);
                    setReposition((v) => !v);
                  }}
                >
                  {t('reposition')}
                </button>
                <button
                  type="button"
                  className={cn(buttonVariants({ size: 'sm', variant: 'outline' }))}
                  disabled={busy}
                  onClick={() => void onRemoveCover()}
                >
                  {t('removeCover')}
                </button>
              </>
            ) : null}
          </div>
        ) : null}

        <div className="relative -mt-12 flex items-end gap-4 px-4 pb-4 sm:px-6">
          <div className="group/logo relative">
            <SpaceLogo
              name={space.name}
              spaceId={space.id}
              logo={space.logo}
              size="lg"
              className="ring-4 ring-background shadow-md"
            />
            {canEdit ? (
              <div className="absolute inset-0 flex items-center justify-center gap-1 rounded-xl bg-black/40 opacity-100 transition-opacity sm:opacity-0 sm:group-hover/logo:opacity-100 sm:focus-within:opacity-100">
                <button
                  type="button"
                  className="rounded bg-background/95 px-2 py-1 text-xs font-medium"
                  disabled={busy}
                  onClick={() => logoInput.current?.click()}
                >
                  {t('changeLogo')}
                </button>
                {space.logo ? (
                  <button
                    type="button"
                    className="rounded bg-background/95 px-2 py-1 text-xs font-medium"
                    disabled={busy}
                    onClick={() => void onRemoveLogo()}
                  >
                    {t('removeLogo')}
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {canEdit && reposition ? (
        <div className="mt-3 flex flex-col gap-2 rounded-xl border border-border/80 p-4">
          <label className="text-sm font-medium" htmlFor="cover-position">
            {t('positionLabel')}
          </label>
          <input
            id="cover-position"
            type="range"
            min={0}
            max={100}
            value={draftY}
            onChange={(e) => setDraftY(Number(e.target.value))}
          />
          <div className="flex gap-2">
            <button
              type="button"
              className={cn(buttonVariants({ size: 'sm' }))}
              disabled={busy}
              onClick={() => void savePosition()}
            >
              {t('savePosition')}
            </button>
            <button
              type="button"
              className={cn(buttonVariants({ size: 'sm', variant: 'outline' }))}
              disabled={busy}
              onClick={() => {
                setDraftY(space.coverPositionY);
                setReposition(false);
              }}
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      ) : null}

      {canEdit ? (
        <div
          className={cn(
            'flex flex-col gap-3',
            variant === 'home' ? 'mt-4' : 'mt-0'
          )}
        >
          <p className="text-sm font-medium text-foreground">{t('presets')}</p>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
            {COVER_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                title={t(`presetNames.${preset}`)}
                aria-label={t(`presetNames.${preset}`)}
                disabled={busy}
                className={cn(
                  'h-10 rounded-lg border-2 transition-colors',
                  space.cover?.kind === 'preset' &&
                    space.cover.preset === preset
                    ? 'border-foreground'
                    : 'border-transparent hover:border-foreground/30'
                )}
                style={{ background: COVER_PRESET_STYLES[preset] }}
                onClick={() => void onPreset(preset)}
              />
            ))}
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {busy ? (
        <p className="mt-2 text-sm text-muted-foreground">{t('uploading')}</p>
      ) : null}

      <input
        ref={logoInput}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={(e) => {
          void onLogoFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      <input
        ref={coverInput}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={(e) => {
          void onCoverFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
    </div>
  );
}

function coverBackground(space: MeSpace, positionY: number): CSSProperties {
  if (space.cover?.kind === 'image') {
    return {
      backgroundImage: `url(${space.cover.url1600})`,
      backgroundSize: 'cover',
      backgroundPosition: `center ${positionY}%`,
    };
  }
  if (space.cover?.kind === 'preset') {
    return {
      background: COVER_PRESET_STYLES[space.cover.preset],
    };
  }
  return {};
}
