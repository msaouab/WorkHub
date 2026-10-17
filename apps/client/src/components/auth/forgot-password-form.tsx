'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from '@/i18n/navigation';
import { authErrorMessage } from '@/lib/auth-errors';
import { authClient } from '@/lib/auth-client';
import { appUrl } from '@/lib/env';
import { createForgotPasswordSchema } from '@/lib/validators/auth';

type ForgotValues = z.infer<ReturnType<typeof createForgotPasswordSchema>>;

export function ForgotPasswordForm() {
  const t = useTranslations('Auth.forgotPassword');
  const tFields = useTranslations('Auth.fields');
  const tAuth = useTranslations('Auth');
  const tErrors = useTranslations('Auth.errors');
  const tValidation = useTranslations('Validation');
  const tCommon = useTranslations('Common');
  const locale = useLocale();
  const schema = useMemo(
    () => createForgotPasswordSchema(tValidation),
    [tValidation]
  );

  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ForgotValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    const { error: authError } = await authClient.requestPasswordReset({
      email: values.email,
      redirectTo: appUrl(`/${locale}/reset-password`),
    });

    if (authError) {
      setError('root', { message: authErrorMessage(authError, tErrors) });
      return;
    }

    setSubmittedEmail(values.email);
  });

  if (submittedEmail) {
    return (
      <div className="flex flex-col gap-5">
        <div>
          <h2 className="font-display text-xl font-semibold text-foreground">
            {t('successTitle')}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {t.rich('successBody', {
              email: () => (
                <bdi className="font-medium text-foreground">
                  {submittedEmail}
                </bdi>
              ),
            })}
          </p>
        </div>
        {process.env.NODE_ENV === 'development' ? (
          <p className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            {tAuth('mailpitHint')}
          </p>
        ) : null}
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

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="forgot-email">{tFields('email.label')}</Label>
        <Controller
          name="email"
          control={control}
          render={({ field, fieldState }) => (
            <Input
              id="forgot-email"
              type="email"
              autoComplete="email"
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              ref={field.ref}
              placeholder={tFields('email.placeholder')}
              className="h-10"
              aria-invalid={fieldState.invalid || undefined}
              required
            />
          )}
        />
        <FieldError message={errors.email?.message} />
      </div>

      <FieldError message={errors.root?.message} />

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? tCommon('sending') : t('submit')}
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
