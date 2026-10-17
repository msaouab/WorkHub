'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useMemo, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateSpace } from '@/hooks/use-create-space';
import { useRouter } from '@/i18n/navigation';
import { ApiError } from '@/lib/api/fetch';
import { setLastSpaceSlug } from '@/lib/last-space';
import { ROUTES } from '@/lib/routes';
import { suggestSpaceSlug } from '@/lib/space-slug';
import { createSpaceFormSchema } from '@/lib/validators/space';

type CreateSpaceValues = z.infer<ReturnType<typeof createSpaceFormSchema>>;

export function CreateSpaceForm() {
  const t = useTranslations('Spaces.create');
  const tValidation = useTranslations('Validation');
  const router = useRouter();
  const create = useCreateSpace();
  const slugTouched = useRef(false);
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

  const slug = watch('slug');
  const suggestedEmpty = Boolean(slug === '' && !slugTouched.current);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const space = await create.mutateAsync(values);
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

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
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
