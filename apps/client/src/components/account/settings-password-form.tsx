'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { authErrorMessage } from '@/lib/auth-errors';
import { authClient } from '@/lib/auth-client';
import { createChangePasswordSchema } from '@/lib/validators/auth';

type PasswordValues = z.infer<ReturnType<typeof createChangePasswordSchema>>;

export function SettingsPasswordForm() {
  const t = useTranslations('Account.settings');
  const tValidation = useTranslations('Validation');
  const tErrors = useTranslations('Auth.errors');
  const tCommon = useTranslations('Common');
  const schema = useMemo(
    () => createChangePasswordSchema(tValidation),
    [tValidation]
  );
  const [changed, setChanged] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PasswordValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      currentPassword: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setChanged(false);
    const { error } = await authClient.changePassword({
      currentPassword: values.currentPassword,
      newPassword: values.password,
      revokeOtherSessions: true,
    });
    if (error) {
      setError('root', { message: authErrorMessage(error, tErrors) });
      return;
    }
    reset();
    setChanged(true);
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <h2 className="font-display text-xl font-semibold">{t('passwordTitle')}</h2>

      <div className="flex flex-col gap-2">
        <Label htmlFor="settings-current-password">{t('currentPassword')}</Label>
        <Controller
          name="currentPassword"
          control={control}
          render={({ field, fieldState }) => (
            <PasswordInput
              id="settings-current-password"
              autoComplete="current-password"
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              ref={field.ref}
              className="h-10"
              aria-invalid={fieldState.invalid || undefined}
            />
          )}
        />
        <FieldError message={errors.currentPassword?.message} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="settings-new-password">{t('newPassword')}</Label>
        <Controller
          name="password"
          control={control}
          render={({ field, fieldState }) => (
            <PasswordInput
              id="settings-new-password"
              autoComplete="new-password"
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              ref={field.ref}
              className="h-10"
              aria-invalid={fieldState.invalid || undefined}
            />
          )}
        />
        <FieldError message={errors.password?.message} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="settings-confirm-password">{t('confirmPassword')}</Label>
        <Controller
          name="confirmPassword"
          control={control}
          render={({ field, fieldState }) => (
            <PasswordInput
              id="settings-confirm-password"
              autoComplete="new-password"
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              ref={field.ref}
              className="h-10"
              aria-invalid={fieldState.invalid || undefined}
            />
          )}
        />
        <FieldError message={errors.confirmPassword?.message} />
      </div>

      <FieldError message={errors.root?.message} />
      {changed ? (
        <p className="text-sm text-foreground" role="status">
          {t('passwordChanged')}
        </p>
      ) : null}

      <Button
        type="submit"
        className="w-full sm:w-auto sm:self-start"
        disabled={isSubmitting}
      >
        {isSubmitting ? tCommon('saving') : t('changePassword')}
      </Button>
    </form>
  );
}
