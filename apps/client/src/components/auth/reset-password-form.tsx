'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button-variants';
import { FieldError } from '@/components/ui/field-error';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { Link, useRouter } from '@/i18n/navigation';
import { authErrorMessage } from '@/lib/auth-errors';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';
import { createResetPasswordSchema } from '@/lib/validators/auth';

type ResetValues = z.infer<ReturnType<typeof createResetPasswordSchema>>;

export function ResetPasswordForm() {
  const t = useTranslations('Auth.resetPassword');
  const tFields = useTranslations('Auth.fields');
  const tErrors = useTranslations('Auth.errors');
  const tValidation = useTranslations('Validation');
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token')?.trim() ?? '';
  const linkError = searchParams.get('error');
  const schema = useMemo(
    () => createResetPasswordSchema(tValidation),
    [tValidation]
  );

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  if (linkError || !token) {
    return (
      <div className="flex flex-col gap-5">
        <p className="text-sm leading-relaxed text-muted-foreground" role="alert">
          {linkError ? t('invalidToken') : t('missingToken')}
        </p>
        <Link
          href="/forgot-password"
          className={cn(buttonVariants({ size: 'lg' }), 'w-full')}
        >
          {t('requestNewLink')}
        </Link>
        <p className="text-center text-sm text-muted-foreground">
          <Link
            href="/sign-in"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            {t('backToSignIn')}
          </Link>
        </p>
      </div>
    );
  }

  const onSubmit = handleSubmit(async (values) => {
    const { error: authError } = await authClient.resetPassword({
      newPassword: values.password,
      token,
    });

    if (authError) {
      setError('root', { message: authErrorMessage(authError, tErrors) });
      return;
    }

    router.replace('/sign-in?reset=1');
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="reset-password">{tFields('newPassword.label')}</Label>
        <Controller
          name="password"
          control={control}
          render={({ field, fieldState }) => (
            <PasswordInput
              id="reset-password"
              autoComplete="new-password"
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              ref={field.ref}
              placeholder={tFields('newPassword.placeholder')}
              aria-invalid={fieldState.invalid || undefined}
              required
            />
          )}
        />
        <FieldError message={errors.password?.message} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="reset-confirm">{tFields('confirmPassword.label')}</Label>
        <Controller
          name="confirmPassword"
          control={control}
          render={({ field, fieldState }) => (
            <PasswordInput
              id="reset-confirm"
              autoComplete="new-password"
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              ref={field.ref}
              placeholder={tFields('confirmPassword.placeholder')}
              aria-invalid={fieldState.invalid || undefined}
              required
            />
          )}
        />
        <FieldError message={errors.confirmPassword?.message} />
      </div>

      <FieldError message={errors.root?.message} />

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? t('submitting') : t('submit')}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        <Link
          href="/sign-in"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          {t('backToSignIn')}
        </Link>
      </p>
    </form>
  );
}
