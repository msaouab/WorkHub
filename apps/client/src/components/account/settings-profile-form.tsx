'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { authErrorMessage } from '@/lib/auth-errors';
import { authClient } from '@/lib/auth-client';
import { createProfileNameSchema } from '@/lib/validators/auth';

type ProfileValues = z.infer<ReturnType<typeof createProfileNameSchema>>;

export function SettingsProfileForm() {
  const t = useTranslations('Account.settings');
  const tValidation = useTranslations('Validation');
  const tErrors = useTranslations('Auth.errors');
  const tCommon = useTranslations('Common');
  const { user } = useAuth();
  const schema = useMemo(
    () => createProfileNameSchema(tValidation),
    [tValidation]
  );
  const [saved, setSaved] = useState(false);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileValues>({
    resolver: zodResolver(schema),
    values: { name: user?.name ?? '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSaved(false);
    const { error } = await authClient.updateUser({ name: values.name });
    if (error) {
      setError('root', { message: authErrorMessage(error, tErrors) });
      return;
    }
    // updateUser already refreshes useSession via $sessionSignal.
    setSaved(true);
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="settings-name">{t('nameLabel')}</Label>
        <Controller
          name="name"
          control={control}
          render={({ field, fieldState }) => (
            <Input
              id="settings-name"
              autoComplete="name"
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              ref={field.ref}
              aria-invalid={fieldState.invalid || undefined}
            />
          )}
        />
        <FieldError message={errors.name?.message} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="settings-email">{t('emailLabel')}</Label>
        <Input
          id="settings-email"
          type="email"
          value={user?.email ?? ''}
          readOnly
          disabled
          dir="ltr"
        />
        <p className="text-xs text-muted-foreground">{t('emailHint')}</p>
      </div>

      <FieldError message={errors.root?.message} />
      {saved ? (
        <p className="text-sm text-foreground" role="status">
          {t('profileSaved')}
        </p>
      ) : null}

      <Button
        type="submit"
        className="w-full sm:w-auto sm:self-start"
        disabled={isSubmitting || !isDirty}
      >
        {isSubmitting ? tCommon('saving') : t('saveProfile')}
      </Button>
    </form>
  );
}
