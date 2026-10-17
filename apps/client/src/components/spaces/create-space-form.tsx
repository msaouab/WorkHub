'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { SpaceLogo } from '@/components/spaces/space-logo';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button-variants';
import { FieldError } from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateSpace } from '@/hooks/use-create-space';
import { useRouter } from '@/i18n/navigation';
import { ApiError } from '@/lib/api/fetch';
import { setLastSpaceSlug } from '@/lib/last-space';
import { ROUTES } from '@/lib/routes';
import { suggestSpaceSlug } from '@/lib/space-slug';
import { cn } from '@/lib/utils';
import { createSpaceFormSchema } from '@/lib/validators/space';

const LOGO_MAX = 2 * 1024 * 1024;
const ACCEPTED = new Set(['image/jpeg', 'image/png', 'image/webp']);

type CreateSpaceValues = z.infer<ReturnType<typeof createSpaceFormSchema>>;

export function CreateSpaceForm() {
  const t = useTranslations('Spaces.create');
  const tValidation = useTranslations('Validation');
  const router = useRouter();
  const create = useCreateSpace();
  const slugTouched = useRef(false);
  const logoInput = useRef<HTMLInputElement>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const schema = useMemo(
    () => createSpaceFormSchema(tValidation),
    [tValidation]
  );

  const {
    control,
    handleSubmit,
    setValue,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateSpaceValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', slug: '' },
  });

  const name = watch('name');
  const slug = watch('slug');
  const suggestedEmpty = Boolean(slug === '' && !slugTouched.current);

  useEffect(() => {
    if (!logoFile) {
      setLogoPreview(null);
      return;
    }
    const url = URL.createObjectURL(logoFile);
    setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  function onLogoPick(file: File | undefined) {
    if (!file) {
      return;
    }
    if (!ACCEPTED.has(file.type)) {
      setLogoError(t('errors.unsupported'));
      return;
    }
    if (file.size > LOGO_MAX) {
      setLogoError(t('errors.tooLarge'));
      return;
    }
    setLogoError(null);
    setLogoFile(file);
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      const space = await create.mutateAsync({
        ...values,
        logo: logoFile ?? undefined,
      });
      setLastSpaceSlug(space.slug);
      router.replace(`${ROUTES.space}/${space.slug}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError('slug', { message: t('slugTaken') });
        return;
      }
      setError('root', { message: t('failed') });
    }
  });

  const previewLogo = logoPreview
    ? { url64: logoPreview, url256: logoPreview }
    : null;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-3">
        <div>
          <Label>{t('logoLabel')}</Label>
          <p className="mt-1 text-xs text-muted-foreground">{t('logoHint')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <SpaceLogo
            name={name.trim() || 'W'}
            spaceId="new"
            logo={previewLogo}
            size="lg"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={cn(buttonVariants({ size: 'sm' }))}
              disabled={isSubmitting || create.isPending}
              onClick={() => logoInput.current?.click()}
            >
              {logoFile ? t('changeLogo') : t('addLogo')}
            </button>
            {logoFile ? (
              <button
                type="button"
                className={cn(buttonVariants({ size: 'sm', variant: 'outline' }))}
                disabled={isSubmitting || create.isPending}
                onClick={() => {
                  setLogoFile(null);
                  setLogoError(null);
                }}
              >
                {t('removeLogo')}
              </button>
            ) : null}
          </div>
        </div>
        {logoError ? (
          <p className="text-sm text-destructive" role="alert">
            {logoError}
          </p>
        ) : null}
        <input
          ref={logoInput}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          onChange={(e) => {
            onLogoPick(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="space-name">{t('nameLabel')}</Label>
        <Controller
          name="name"
          control={control}
          render={({ field, fieldState }) => (
            <Input
              id="space-name"
              value={field.value}
              onValueChange={(value) => {
                field.onChange(value);
                if (!slugTouched.current) {
                  setValue('slug', suggestSpaceSlug(value), {
                    shouldValidate: false,
                  });
                }
              }}
              onBlur={field.onBlur}
              ref={field.ref}
              placeholder={t('namePlaceholder')}
              className="h-10"
              aria-invalid={fieldState.invalid || undefined}
              required
              autoFocus
            />
          )}
        />
        <FieldError message={errors.name?.message} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="space-slug">{t('slugLabel')}</Label>
        <Controller
          name="slug"
          control={control}
          render={({ field, fieldState }) => (
            <Input
              id="space-slug"
              value={field.value}
              onValueChange={(value) => {
                slugTouched.current = true;
                field.onChange(value.toLowerCase());
              }}
              onBlur={field.onBlur}
              ref={field.ref}
              placeholder={t('slugPlaceholder')}
              className="h-10 font-mono text-sm"
              aria-invalid={fieldState.invalid || undefined}
              required
            />
          )}
        />
        <p className="text-xs text-muted-foreground">
          {suggestedEmpty ? t('slugLatinHint') : t('slugHint')}
        </p>
        <FieldError message={errors.slug?.message} />
      </div>

      <FieldError message={errors.root?.message} />

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={isSubmitting || create.isPending}
      >
        {isSubmitting || create.isPending ? t('submitting') : t('submit')}
      </Button>
    </form>
  );
}
